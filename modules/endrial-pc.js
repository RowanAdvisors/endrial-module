/**
 * An Actor sheet for player character type actors in the PF system.
 * Extends the base ActorSheetPF class.
 * @type {ActorSheetPF}
 */
export class EndrialSheetPFCharacter extends game.pf1.applications.ActorSheetPFCharacter {
  /**
   * Define default rendering options for the NPC sheet
   * @return {Object}
   */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pf1", "sheet", "actor", "character"],
      width: 800,
      height: 840,
    });
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * Get the correct HTML template path to use for rendering this particular sheet
   * @type {String}
   */
  get template() {
    if (!game.user.isGM && this.actor.limited) return "modules/endrial-module/template/limited-sheet.hbs";
    return "modules/endrial-module/template/character-sheet.hbs";
  }

  /* -------------------------------------------- */

  
}
