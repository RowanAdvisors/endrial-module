/**
 * Adapted for PF1 system from original module: https://github.com/jopeek/fvtt-loot-sheet-npc-5e
 */ 

 import { EndrialSheetConstants } from "./modules/constants.js";
 import { ActorPFEndrial } from "./modules/endrial-entity.js"
 
 // Module's entry point
 Hooks.on("ready", async () => {
   EndrialSheetConstants.EndrialSheetPFCharacter = (await import("./modules/endrial-pc.js")).EndrialSheetPFCharacter;
   EndrialSheetConstants.EndrialSheetPFNPC = (await import("./modules/endrial-npc.js")).EndrialSheetPFNPC;
  
  //Register the custom PC sheet
  Actors.registerSheet("pf1", EndrialSheetConstants.EndrialSheetPFCharacter, {
    types: ["character"],
    makeDefault: true
  });
  
  //Register the custom NPC sheet
  Actors.registerSheet("pf1", EndrialSheetConstants.EndrialSheetPFNPC, {
    types: ["npc"],
    makeDefault: true
  });
  
  if(!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
        ui.notifications.error("Endrial Module requires the 'libWrapper' module. Please install and activate it.");
  } else {

  }
  
});

/**
 * Register drop action on actor
 */
/*Hooks.on('renderActorDirectory', (app, html, data) => {
  
  function giveItemTo(actorDestId, event) {
    event.preventDefault();
    
    // try to extract the data
    let data;
    let extraData = {};
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (data.type !== "Item") return;
    } catch (err) {
      return false;
    }
    
    const giver = game.actors.get(data.actorId)
    const receiver = game.actors.get(actorDestId)
    const item = giver.getEmbeddedEntity("OwnedItem", data.data._id);
    
    // validate the type of item to be "moved" or "added"
    if(!["weapon","equipment","consumable","loot"].includes(item.type)) {
      ui.notifications.error(game.i18n.localize("ERROR.lsGiveInvalidType"));
      return false;
    }
    
    let targetGm = null;
    game.users.forEach((u) => {
      if (u.isGM && u.active && u.viewedScene === game.user.viewedScene) {
        targetGm = u;
      }
    });
    
    //if (data.actorId === actorDestId) {
    //  ui.notifications.error(game.i18n.localize("ERROR.lsWhyGivingToYourself"));
    //  console.log("Loot Sheet | Ignoring giving something to same person")
    //  return false;
    //}
    
    let options = {}
    if (data.actorId === actorDestId) {
      if(item.data.quantity == 1) {
        ui.notifications.error(game.i18n.localize("ERROR.lsWhyGivingToYourself"));
        console.log("Loot Sheet | Ignoring giving something to same person")
        return false;
      }
      options['title'] = game.i18n.localize("ls.giveTitleSplit");
      options['acceptLabel'] = game.i18n.localize("ls.split");
    } else if(item.data.quantity == 1) {
      options['title'] = game.i18n.localize("ls.give");
      options['label'] = game.i18n.format("ls.giveContentSingle", {item: item.name, actor: receiver.name });
      options['quantity'] = 1
      options['acceptLabel'] = game.i18n.localize("ls.give");
    } else {
      options['title'] = game.i18n.format("ls.giveTitle", {item: item.name, actor: receiver.name });
      options['label'] = game.i18n.localize("ls.giveContent");
      options['acceptLabel'] = game.i18n.localize("ls.give");
    }
    
    let d = new QuantityDialog((quantity) => {
    
      if( game.user.isGM ) {
        LootSheetActions.giveItem(game.user, data.actorId, actorDestId, data.data._id, quantity)
      } else {
        const packet = {
          type: "give",
          userId: game.user._id,
          actorId: data.actorId,
          itemId: data.data._id,
          targetActorId: actorDestId,
          processorId: targetGm.id,
          quantity: quantity
        };
        console.log(`Loot Sheet | Sending packet to ${actorDestId}`)
        game.socket.emit(EndrialSheetConstants.SOCKET, packet);
      }
    }, options);
    d.render(true);

  }
  
  html.find('li.actor').each((i, li) => {
    li.addEventListener("drop", giveItemTo.bind(this, li.getAttribute("data-entity-id")));
  });
});*/

Hooks.on("actorRest", (actor,options,updateData,itemUpdates)=> {
  const promises = [];
  let vigor = actor.data.data.attributes.vigor,
    wounds = actor.data.data.attributes.wounds;
  let woundInc = 1;
  if(options?.longTermCare) {
    woundInc += 1;
  }
  console.log(Math.clamped(wounds.value + woundInc, 0, wounds.max));
  promises.push(
    actor.update({
      "data.attributes.vigor.value": vigor.max,
      "data.attributes.wounds.value":Math.clamped(wounds.value + woundInc, 0, wounds.max)
    })
  );
  return Promise.all(promises);
  //recover wounds
});

Hooks.once("init", () => {

  loadTemplates([
    "modules/endrial-module/template/parts/actor-attributes.hbs",
    "modules/endrial-module/template/parts/actor-buffs.hbs",
    "modules/endrial-module/template/parts/actor-combat.hbs",
    "modules/endrial-module/template/parts/actor-defenses_tables.hbs",
    "modules/endrial-module/template/parts/actor-features.hbs",
    "modules/endrial-module/template/parts/actor-inventory.hbs",
    "modules/endrial-module/template/parts/actor-settings.hbs",
    "modules/endrial-module/template/parts/actor-skills-front.hbs",
    "modules/endrial-module/template/parts/actor-skills.hbs",
    "modules/endrial-module/template/parts/actor-spellbook-front.hbs",
    "modules/endrial-module/template/parts/actor-spellbook.hbs",
    "modules/endrial-module/template/parts/actor-summary.hbs",
    "modules/endrial-module/template/parts/actor-traits.hbs",
    "modules/endrial-module/template/character-sheet.hbs",
    "modules/endrial-module/template/limited-sheet.hbs",
    "modules/endrial-module/template/npc-sheet.hbs"
  ]);
  

  libWrapper.register('endrial-module', 'game.pf1.entities.ItemPF._onChatCardAction', function (wrapped, ...args) {
    //console.log(args);
    // Extract card data
    const button = args[1].button;
    const item = args[1].item;
    const card = button.closest(".chat-card");
    const cardbuttongrp = button.closest(".card-button-group");
    const action = button.dataset.action;
    console.log(action);
    if (action == "applyDamage") {
      return ActorPFEndrial.applyDamage(button.dataset.value, cardbuttongrp, item);
    }
    // ... do things ...
    let result = wrapped(...args);
    // ... do things ...
    return result;
}, 'MIXED' /* optional, since this is the default type */ );
  
  //Override Actor Behaviour:
  //game.pf1.entities.ActorPF.applyDamage = ActorPFEndrial.applyDamage
  /*game.settings.register(EndrialSheetConstants.MODULENAME, "changeScrollIcon", {
    name: game.i18n.localize("SETTINGS.lsChangeIconForSpellScrollsTitle"), 
    hint: game.i18n.localize("SETTINGS.lsChangeIconForSpellScrollsHint"), 
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });*/

  /*******************************************
   *          SOCKET HANDLING!
   *******************************************/
  /*game.socket.on(EndrialSheetConstants.SOCKET, data => {
    console.log("Endrial Sheet | Socket Message: ", data);
    if (game.user.isGM && data.processorId === game.user.id) {
      let user = game.users.get(data.userId);
      let sourceActor = game.actors.get(data.actorId);
      let targetActor = data.tokenId ? canvas.tokens.get(data.tokenId).actor : game.actors.get(data.targetActorId);
        
      
    }
    if (data.type === "error" && data.targetId === game.user.actorId) {
      console.log("Loot Sheet | Transaction Error: ", data.message);
      return ui.notifications.error(data.message);
    }
  });*/

});


