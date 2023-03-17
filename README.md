# Pathfinder 2e Proficiency Level Scaler

Adds the possibility to scale players characters, items and npc different than +1 per level.
Scales the level bonus for proficiency by setting a divisor. Every player character, newly created NPC, DC check in descriptions and the untrained proficiency you get from some feats are adjusted.

## TODO/Not yet implemented

Automatically adjust all or adjust selective npc actors.

## Disadvantage

At the moment this needs the special PF2e system I have on my github.

Creating a custom @Check command in the chat while selecting an actor or item will apply the modifications. So typing @Check[type:reflex|dc:26] with a level 11 npc selected while the divisor is set to 2.0 will result in a DC 20 check. I don't see an easy way of solving that.
