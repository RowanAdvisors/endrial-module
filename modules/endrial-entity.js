export class ActorPFEndrial {
  /**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {Array} options       The Array of Context Menu options
 *
 * @returns {Array}              The extended options Array including new context choices
 */


    /**
   * Apply rolled dice damage to the token or tokens which are currently controlled.
   * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
   * If Shift is held, will prompt for adjustments based on damage reduction and energy resistances
   *
   * @param {number} value - The amount of damage to deal.
   * @param {object} [options] - Object containing default settings for overriding
   * @param {boolean} [options.forceDialog=true] - Forces the opening of a Dialog as if Shift was pressed
   * @param {string} [options.reductionDefault] - Default value for Damage Reduction
   * @param {boolean} [options.asNonlethal] - Marks the damage as non-lethal
   * @returns {Promise}
   */
  static async applyDamage(value, cardbuttongrp, item, { forceDialog = false, reductionDefault = "", asNonlethal = false } = {}) {
    const promises = [];
    var controlled = canvas.tokens.controlled,
      healingInvert = 1,
      numReg = /(\d+)/g,
      sliceReg = /[^,;\n]*(\d+)[^,;\n]*/g;

      //prep conditional things that might be used in both systems
      let crit = cardbuttongrp.innerText.indexOf("Critical"); //-1 if not a crit
      asNonlethal = item.data.data.nonlethal;
      let multiply = item.data.data.ability.critMult;
      let sneak = item.data.data.conditionals?.find((i) => { return i.name === "Sneak Attack"; });
      

    //if (!controlled) return;
    //get Health Config
    let healthConfig = game.settings.get("pf1", "healthConfig");
    let useWoundsAndVigor = healthConfig.variants["pc"].useWoundsAndVigor;
    
    const _submit = async function (form, multiplier) {
      if (form) {
        value = form.find('[name="damage"]').val();
        let dR = form.find('[name="damage-reduction"]').val();
        value = value.length ? RollPF.safeRoll(value, {}, []).total : 0;
        dR = dR.length ? RollPF.safeRoll(dR, {}, []).total : 0;
        if (multiplier < 0) {
          value = Math.ceil(value * multiplier);
          value = Math.min(value - dR, 0);
        } else {
          value = Math.floor(value * (multiplier ?? 1));
          value = Math.max(value - dR, 0);
        }
        let checked = [...form.find(".tokenAffected:checked")].map((tok) => tok.name.replace("affect.", ""));
        controlled = controlled.filter((con) => checked.includes(con.id));
      }
      for (let t of controlled) {

        let a = t.actor;
        
        if(!useWoundsAndVigor) {
        
          let hp = a.data.data.attributes.hp,
          tmp = parseInt(hp.temp) || 0;

        // Handle nonlethal damage
        let nld = 0;
        if (asNonlethal && value > 0) {
          nld = Math.min(hp.max - hp.nonlethal, value);
          value -= nld;
        }

        // Temp HP adjustment
        let dt = value > 0 ? Math.min(tmp, value) : 0;

        if (!a.isOwner) {
          //const msg = game.i18n.localize("PF1.ErrorNoActorPermissionAlt").format(this.name);
          //console.warn(msg);
          //ui.notifications.warn(msg);
          //continue;
        }

          promises.push(
            t.actor.update({
              "data.attributes.hp.nonlethal": hp.nonlethal + nld,
              "data.attributes.hp.temp": tmp - dt,
              "data.attributes.hp.value": Math.clamped(hp.value - (value - dt), -100, hp.max),
            })
          );
        } else {
          //use wounds and vigor
          let vigor = a.data.data.attributes.vigor,
          hp = a.data.data.attributes.hp,
          tmp = parseInt(vigor.temp) || 0,
          wounds = a.data.data.attributes.wounds;

          
          // Temp vigor adjustment
          let dt = value > 0 ? Math.min(tmp, value) : 0;

          // Handle nonlethal damage
          let nld = 0;
          if (asNonlethal && value > 0 && vigor.value - (value -dt) <= 0) {
            nld = value - dt - vigor.value;
            value -= nld;
          }

          

          //deal wounds when out of vigor
          if(vigor.value - (value-dt) <= 0) {
            wounds.value = Math.clamped(wounds.value - (value-dt-vigor.value), 0, wounds.max);
          }

          //Sneak Wound damage
          let sneakDmg = 0;
          if(sneak !== undefined) {
            let sneakDice = sneak.modifiers[0].formula;
            sneakDice = sneakDice.substr(0,sneakDice.toLowerCase().indexOf("d"));
            sneakDmg = Math.floor(Number.parseInt(sneakDice) / 2);
          }

          //Crit wound damage
          let critDmg = 0
          if(crit >= 0) {
            //add crit logic here
            critDmg = multiply;
          }
          


          promises.push(
            t.actor.update({
              "data.attributes.hp.nonlethal": hp.nonlethal + nld,
              "data.attributes.vigor.temp": tmp - dt,
              "data.attributes.vigor.value": Math.clamped(vigor.value - (value - dt), 0, vigor.max),
              "data.attributes.wounds.value":Math.clamped(wounds.value - sneakDmg - critDmg, 0, wounds.max)
            })
          );
        }
      }
      return Promise.all(promises);
    };

    if (game.keyboard.isDown("Shift") ? !forceDialog : forceDialog) {
      if (value < 0) {
        healingInvert = -1;
        value = -1 * value;
      }
      let tokens = controlled.map((tok) => {
        return {
          _id: tok.id,
          name: tok.name,
          dr: tok.actor.data.data.traits.dr.match(sliceReg),
          eres: tok.actor.data.data.traits.eres.match(sliceReg),
          checked: true,
        };
      });

      reductionDefault = reductionDefault ?? "";

      // Dialog configuration and callbacks
      let template = "systems/pf1/templates/apps/damage-dialog.hbs";
      let dialogData = {
        damage: value,
        healing: healingInvert == -1 ? true : false,
        damageReduction: reductionDefault,
        tokens: tokens,
        nonlethal: asNonlethal,
      };
      const html = await renderTemplate(template, dialogData);

      return new Promise((resolve) => {
        const buttons = {};
        buttons.normal = {
          label: game.i18n.localize("PF1.Apply"),
          callback: (html) => resolve(_submit.call(this, html, 1 * healingInvert)),
        };
        buttons.half = {
          label: game.i18n.localize("PF1.ApplyHalf"),
          callback: (html) => resolve(_submit.call(this, html, 0.5 * healingInvert)),
        };

        var d = new Dialog({
          title: healingInvert > 0 ? game.i18n.localize("PF1.ApplyDamage") : game.i18n.localize("PF1.ApplyHealing"),
          content: html,
          buttons: buttons,
          default: "normal",
          close: (html) => {
            resolve(false);
          },
          render: (inp) => {
            /**
             *
             */
            function swapSelected() {
              let checked = [...inp[0].querySelectorAll('.selected-tokens input[type="checkbox"]')];
              checked.forEach((chk) => (chk.checked = !chk.checked));
            }
            /**
             * @param e
             */
            function setReduction(e) {
              inp[0].querySelector('input[name="damage-reduction"]').value =
                e.currentTarget.innerText.match(numReg) ?? "";
            }
            /**
             * @param event
             */
            function mouseWheelAdd(event) {
              const el = event.currentTarget;

              //Digits with optional sign only
              if (/[^\d+-]|(?:\d[+-])/.test(el.value.trim())) return;

              const value = parseFloat(el.value) || 0;
              const increase = -Math.sign(event.originalEvent.deltaY);

              el.value = (value + increase).toString();
            }

            inp.on("click", 'a[name="swap-selected"]', swapSelected);
            inp.on("click", 'a[name="clear-reduction"], p.notes a', setReduction);
            inp.on("wheel", "input", mouseWheelAdd);
          },
        });
        d.render(true);
      });
    } else {
      //await ;
      return _submit();
    } 
  }

  
}