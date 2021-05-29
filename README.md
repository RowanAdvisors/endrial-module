# Endrial Module

This module modifies the core PF1 system when turned on.

List of modified rules:
- Married wounds and vigor, and wounds thresholds
- Custom wounds calculation (2*CON + CON-mod per level)
- Rest:
    - Restore all vigor
    - Restore 1 wound, 2 if long term care is done
- Nonleathal Damage changes:
    - decrease vigor until 0, after that track nonleathal damage counting up
    - when nonleathal damage is >= your current wounds you become unconcious
- Applying Damage/Healing via chat button:
    - decreases vigor until 0 then decreases wounds
    - applies healing only to vigor, wounds must be manually healed
    - crit damage applies wound damage based on the multiplier of the weapon used to attack
    - Sneak Attack conditional modifier's dice are applied to wound damage (half the number of sneak dice rounded down)

<p style="color:red">Development in progress ...</p>

