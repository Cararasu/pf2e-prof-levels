
const basename = "pf2e-prof-levels";

const scaling_name = "scaling";
var setting = {
    scaling: 0.0
};

function registerSettings() {
	game.settings.register(basename, scaling_name, {
		name: basename + ".settings.scaling.name",
		hint: basename + ".settings.scaling.hint",
		scope: "world",
		config: true,
		type: Number,
		default: 1.0,
        range: {
            min: 0,
            max: 20
        },
        onChange: value => {
            setting.scaling = value;
        }
	});
    setting.scaling = game.settings.get(basename, scaling_name);
};

function get_level_scaling(level) {
    if (setting.scaling == 0.0)
        return 0;
    return Math.floor(level / setting.scaling);
}

function apply_change(obj, path, lvl, changes) {
    if ("value" in obj) {
        const old_value = "pf2_value" in obj ? obj.pf2_value : obj.value;
        const new_value = old_value - lvl + get_level_scaling(lvl);
        changes[path + ".value"] = new_value;
        changes[path + ".pf2_value"] = old_value;
    }
    if ("dc" in obj) {
        const old_dc = "pf2_dc" in obj ? obj.pf2_dc : obj.dc;
        const new_dc = old_dc - lvl;
        changes[path + ".dc"] = new_dc + get_level_scaling(lvl);
        changes[path + ".pf2_dc"] = old_dc;
    }
}

function adapt_lore(lore, lvl = 0) {
    const changes = {};
    apply_change(lore.system.mod, "system.mod", lvl, changes);
    lore.updateSource(changes);
}

function adapt_spellcasting_entry(spellcastingEntry, lvl = 0) {
    const changes = {};
    apply_change(spellcastingEntry.system.spelldc, "system.spelldc", lvl, changes);
    spellcastingEntry.updateSource(changes);
}

function adapt_melee(melee, lvl = 0) {
    const changes = {};
    apply_change(melee.system.bonus, "system.bonus", lvl, changes);
    melee.updateSource(changes);
}

function adapt_item(item, lvl = 0) {
    lvl = item.system.level?.value ?? lvl;
    switch (item.type) {
        case "spellcastingEntry":
        case "spell":
        case "lore":
        case "action":
        case "weapon":
        case "equipment":
        case "consumable":
            // Modifiers are adjusted in the description during the @Check parsing
            break;
        case "melee":
            {
                const changes = {};
                const melee = item;
                apply_change(melee.system.bonus, "system.bonus", lvl, changes);
                melee.updateSource(changes);
            }
            break;
        default:
            console.error("Unknown Item type " + item.type);
            break;
    }
}

function adapt_npc(npc, lvl = 0) {
    const changes = {};
    apply_change(npc.system.saves.fortitude, "system.saves.fortitude", lvl, changes);
    apply_change(npc.system.saves.reflex, "system.saves.reflex", lvl, changes);
    apply_change(npc.system.saves.will, "system.saves.will", lvl, changes);

    npc.updateSource(changes);
}

function adapt_hazard(hazard, lvl = 0) {
    const changes = {};

    apply_change(hazard.system.attributes.stealth, "system.attributes.stealth", lvl, changes);

    hazard.updateSource(changes);
}

function adapt_actor(actor, lvl = 0) {
    lvl = actor.system.details.level.value ?? lvl;

    const changes = {};
    if ("ac" in actor.system.attributes && (actor.system.attributes.ac?.value ?? 0) > 0)
        apply_change(actor.system.attributes.ac, "system.attributes.ac", lvl, changes);
    if ("perception" in actor.system.attributes && (actor.system.attributes.perception?.value ?? 0) > 0)
        apply_change(actor.system.attributes.perception, "system.attributes.perception", lvl, changes);
    actor.items.forEach((item) => adapt_item(item, lvl));
    actor.itemTypes.lore.forEach((lore) => adapt_lore(lore, lvl));
    actor.itemTypes.melee.forEach((melee) => adapt_melee(melee, lvl));
    actor.itemTypes.spellcastingEntry.forEach((spellcastingEntry) =>
        adapt_spellcasting_entry(spellcastingEntry, lvl)
    );
    actor.updateSource(changes);

    if (actor.type === "npc") {
        adapt_npc(actor, lvl);
    } else if (actor.type === "player") {
        console.log("ignore player");
    } else if (actor.type === "hazard") {
        adapt_hazard(actor, lvl);
    } else {
        console.error("Actor Type not handled " + actor.type);
    }
}

Hooks.once("init", () => {
	registerSettings();
	game.pf2e.variantRules.ProficiencyWithoutLevel.untrainedProficiencyCallbacks.push((ctx) => {
        return get_level_scaling(ctx.initialLevel);
	});
	game.pf2e.variantRules.ProficiencyWithoutLevel.applyLevelCallbacks.push((ctx) => {
        return get_level_scaling(ctx.initialLevel);
	});
	game.pf2e.variantRules.ProficiencyWithoutLevel.applyDCCallbacks.push((ctx) => {
        return ctx.initialDC - ctx.level + get_level_scaling(ctx.level);
	});
	game.pf2e.variantRules.ProficiencyWithoutLevel.applySimpleDCCallbacks.push((ctx) => {
        if (setting.scaling == 0.0)
            return ctx.initialDC;
        var over20 = Math.max(0, dc - 20);
        return ctx.initialDC - over20 + Math.floor(over20 / setting.scaling);
	});
	game.pf2e.variantRules.ProficiencyWithoutLevel.applyCheckCallbacks.push((ctx) => {
        var level = Number(ctx.item?.system.level?.value ?? ctx.actor?.system.details.level.value ?? 0);
        return ctx.initialDC - level + get_level_scaling(level);
	});
});

Hooks.on("preCreateActor", (obj) => {
	adapt_actor(obj);
	return true;
});
Hooks.on("preCreateItem", (obj) => {
	adapt_item(obj);
	return true;
});











