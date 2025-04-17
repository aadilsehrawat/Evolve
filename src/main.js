import { global, save, seededRandom, webWorker, intervals, keyMap, atrack, resizeGame, breakdown, sizeApproximation, keyMultiplier, power_generated, p_on, support_on, int_on, gal_on, spire_on, set_qlevel, quantum_level } from './vars.js';
import { loc } from './locale.js';
import { unlockAchieve, checkAchievements, drawAchieve, alevel, universeAffix, challengeIcon, unlockFeat, checkAdept } from './achieve.js';
import { gameLoop, vBind, popover, clearPopper, flib, tagEvent, timeCheck, arpaTimeCheck, timeFormat, powerModifier, modRes, initMessageQueue, messageQueue, calc_mastery, calcPillar, darkEffect, calcQueueMax, calcRQueueMax, buildQueue, shrineBonusActive, getShrineBonus, eventActive, easterEggBind, trickOrTreatBind, powerGrid, deepClone, addATime, exceededATimeThreshold, loopTimers, calcQuantumLevel } from './functions.js';
import { races, traits, racialTrait, orbitLength, servantTrait, randomMinorTrait, biomes, planetTraits, shapeShift, fathomCheck, blubberFill } from './races.js';
import { defineResources, resource_values, spatialReasoning, craftCost, plasmidBonus, faithBonus, tradeRatio, craftingRatio, crateValue, containerValue, tradeSellPrice, tradeBuyPrice, atomic_mass, supplyValue, galaxyOffers } from './resources.js';
import { defineJobs, job_desc, loadFoundry, farmerValue, jobScale, workerScale, limitCraftsmen, loadServants} from './jobs.js';
import { defineIndustry, f_rate, manaCost, setPowerGrid, gridEnabled, gridDefs, nf_resources, replicator, luxGoodPrice, smelterUnlocked } from './industry.js';
import { checkControlling, garrisonSize, armyRating, govTitle, govCivics, govEffect, weaponTechModifer } from './civics.js';
import { actions, updateDesc, checkTechRequirements, drawEvolution, BHStorageMulti, storageMultipler, checkAffordable, drawCity, drawTech, gainTech, housingLabel, updateQueueNames, wardenLabel, planetGeology, resQueue, bank_vault, start_cataclysm, orbitDecayed, postBuild, skipRequirement, structName, templeCount, initStruct, handlePlasmidParameter } from './actions.js';
import { renderSpace, convertSpaceSector, fuel_adjust, int_fuel_adjust, zigguratBonus, planetName, genPlanets, setUniverse, universe_types, gatewayStorage, piracy, spaceTech, universe_affixes } from './space.js';
import { renderFortress, bloodwar, soulForgeSoldiers, hellSupression, genSpireFloor, mechRating, mechCollect, updateMechbay } from './portal.js';
import { asphodelResist, mechStationEffect, renderEdenic } from './edenic.js';
import { renderTauCeti, syndicate, shipFuelUse, spacePlanetStats, genXYcoord, shipCrewSize, tpStorageMultiplier, tritonWar, sensorRange, erisWar, calcAIDrift, drawMap, tauEnabled, shipCosts, buildTPShipQueue } from './truepath.js';
import { arpa, buildArpa, sequenceLabs } from './arpa.js';
import { events, eventList } from './events.js';
import { govern, govActive, removeTask } from './governor.js';
import { production, highPopAdjust, teamster, factoryBonus } from './prod.js';
import { swissKnife } from './tech.js';
import { vacuumCollapse } from './resets.js';
import { index, mainVue, initTabs, loadTab } from './index.js';
import { setWeather, seasonDesc, astrologySign, astroVal } from './seasons.js';
import { getTopChange } from './wiki/change.js';
import { enableDebug, updateDebugData } from './debug.js';

{
    $(document).ready(function() {
        if (!window.matchMedia)
            return;

        var current = $('head > link[rel="icon"][media]');
        $.each(current, function(i, icon) {
            var match = window.matchMedia(icon.media);
            function swap() {
                if (match.matches) {
                    current.remove();
                    current = $(icon).appendTo('head');
                }
            }
            match.addListener(swap);
            swap();
        });
    });
}

var multitab = false;
window.addEventListener('storage', (e) => {
    if (multitab === false){
        messageQueue(loc(`multitab_warning`), 'danger', true);
    }
    multitab = true;
});

if (global.settings.expose){
    enableDebug();
}

var quickMap = {
    showCiv: 1,
    showCivic: 2,
    showResearch: 3,
    showResources: 4,
    showGenetics: 5,
    showAchieve: 6,
    settings: 7
};

$(document).keydown(function(e){
    e = e || window.event;
    let key = e.key || e.keyCode;
    Object.keys(keyMap).forEach(function(k){
        if (key === global.settings.keyMap[k]){
            keyMap[k] = true;
        }
    });
    if (!$(`input`).is(':focus') && !$(`textarea`).is(':focus')){
        Object.keys(quickMap).forEach(function(k){
            if (key === global.settings.keyMap[k] && global.settings.civTabs !== 0 && (k === 'settings' || global.settings[k])){
                if (global.settings.civTabs !== quickMap[k]) {
                    global.settings.civTabs = quickMap[k];
                }
                else {
                    let s = global.settings;
                    let tabName = null;
                    let tabList = null;
                    switch(quickMap[k]) {
                            // Some sub tabs are always visible, and JavaScript strings
                            // are truthy, so the sub tab name is used for clarity.
                        case quickMap.showCiv:
                            tabName = 'spaceTabs';
                            tabList = [s.showCity, s.showSpace, s.showDeep, s.showGalactic, s.showPortal, s.showOuter, s.showTau, s.showEden];
                            break;
                        case quickMap.showCivic:
                            // not reaching Military
                            tabName = 'govTabs';
                            tabList = ["Government", s.showIndustry, s.showPowerGrid, s.showMil, s.showMechLab, s.showShipYard, s.showPsychic, s.showWish];
                            break;
                        case quickMap.showResearch:
                            tabName = 'resTabs';
                            tabList = ["New", "Completed"]; // always visible
                            break;
                        case quickMap.showResources:
                            tabName = 'marketTabs';
                            tabList = [s.showMarket, s.showStorage, s.showEjector, s.showCargo, s.showAlchemy];
                            break;
                        case quickMap.showGenetics:
                            s = global.settings.arpa;
                            tabName = 'arpaTabs';
                            tabList = [s.physics, s.genetics, s.crispr, s.blood];
                            break;
                        case quickMap.showAchieve:
                            tabName = 'statsTabs';
                            tabList = ["Stats", "Achievements", "Perks"]; // always visible
                            break;
                        case quickMap.settings:
                        default:
                            // no sub tabs
                            tabName = '';
                            tabList = [];
                            break;
                    }
                    for (let i = 1; i < tabList.length; i+=1) {
                        let next = (s[tabName] + i) % tabList.length
                        if (tabList[next]) {
                            s[tabName] = next;
                            break;
                        }
                    }
                }
                if (!global.settings.tabLoad){
                    loadTab(global.settings.civTabs);
                }
            }
        });
    }
});
$(document).keyup(function(e){
    e = e || window.event;
    let key = e.key || e.keyCode;
    Object.keys(keyMap).forEach(function(k){
        if (key === global.settings.keyMap[k]){
            keyMap[k] = false;
        }
    });
});
$(document).mousemove(function(e){
    e = e || window.event;
    Object.keys(global.settings.keyMap).forEach(function(k){
        switch(global.settings.keyMap[k]){
            case 'Shift':
            case 16:
                keyMap[k] = e.shiftKey ? true : false;
                break;
            case 'Control':
            case 17:
                keyMap[k] = e.ctrlKey ? true : false;
                break;
            case 'Alt':
            case 18:
                keyMap[k] = e.altKey ? true : false;
                break;
            case 'Meta':
            case 91:
                keyMap[k] = e.metaKey ? true : false;
                break;
        }
    });
});

index();
handlePlasmidParameter();
var revision = global['revision'] ? global['revision'] : '';
if (global['beta']){
    $('#topBar .version > a').html(`v${global.version} Beta ${global.beta}${revision}`);
}
else {
    $('#topBar .version > a').html('v'+global.version+revision);
}

initMessageQueue();

if (global.lastMsg){
    Object.keys(global.lastMsg).forEach(function (tag){
        global.lastMsg[tag].reverse().forEach(function(msg){
            messageQueue(msg.m, msg.c, true, [tag], true);
        });
        global.lastMsg[tag].reverse();
    });
}

$(`#msgQueue`).height(global.settings.msgQueueHeight);
$(`#buildQueue`).height(global.settings.buildQueueHeight);

if (global.queue.rename === true){
    updateQueueNames(true);
    global.queue.rename = false;
}

global.settings.sPackMsg = save.getItem('string_pack_name') ? loc(`string_pack_using`,[save.getItem('string_pack_name')]) : loc(`string_pack_none`);

if (global.queue.display){
    calcQueueMax();
}
if (global.r_queue.display){
    calcRQueueMax();
}

mainVue();

if (global['new']){
    messageQueue(loc('new'), 'warning',false,['progress']);
    global['new'] = false;
}
if (global.city['mass_driver']){
    p_on['mass_driver'] = global.city['mass_driver'].on;
}
if (global.portal['turret']){
    p_on['turret'] = global.portal.turret.on;
}
if (global.interstellar['starport']){
    p_on['starport'] = global.interstellar.starport.on;
}
if (global.interstellar['fusion']){
    int_on['fusion'] = global.interstellar.fusion.on;
}
if (global.portal['hell_forge']){
    p_on['hell_forge'] = global.portal.hell_forge.on;
}
if (global.space['sam']){
    p_on['sam'] = global.space.sam.on;
}
if (global.space['operating_base']){
    p_on['operating_base'] = global.space.operating_base.on;
    support_on['operating_base'] = global.space.operating_base.on;
}
if (global.space['fob']){
    p_on['fob'] = global.space.fob.on;
}
if (global.tauceti['fusion_generator']){
    p_on['fusion_generator'] = global.tauceti.fusion_generator.on;
}
if (global.eden['encampment']){
    p_on['encampment'] = global.eden.encampment.on;
}
if (global.eden['soul_engine']){
    p_on['soul_engine'] = global.eden.soul_engine.on;
    support_on['soul_engine'] = global.eden.soul_engine.on;
}
if (global.eden['ectoplasm_processor']){
    p_on['ectoplasm_processor'] = global.eden.ectoplasm_processor.on;
    support_on['ectoplasm_processor'] = global.eden.ectoplasm_processor.on;
}
if (global.eden['research_station']){
    p_on['research_station'] = global.eden.research_station.on;
    support_on['research_station'] = global.eden.research_station.on;
}
if (global.eden['bunker']){
    p_on['bunker'] = global.eden.bunker.on;
    support_on['bunker'] = global.eden.bunker.on;
}
if (global.eden['spirit_vacuum']){
    p_on['spirit_vacuum'] = global.eden.spirit_vacuum.on;
}
if (global.eden['spirit_battery']){
    p_on['spirit_battery'] = global.eden.spirit_battery.on;
}
if (global.city['replicator'] && global.race?.replicator?.pow && global.race?.governor?.config?.replicate?.pow?.on){
    if (Object.values(global.race.governor.tasks).includes('replicate')){
        global.city.replicator.on = 0;
        global.city.replicator.count = 0;
        global.race.replicator.pow = 0;
    }
}

defineJobs(true);
defineResources();
initTabs();
buildQueue();
if (global.race['shapeshifter']){
    shapeShift(false,true);
}

Object.keys(gridDefs()).forEach(function(gridtype){
    powerGrid(gridtype);
});

resizeGame();

vBind({
    el: '#race',
    data: {
        race: global.race,
        city: global.city
    },
    methods: {
        name(){
            return flib('name');
        }
    },
    filters: {
        replicate(kw){
            if (global.race.hasOwnProperty('governor') && global.race.governor.hasOwnProperty('tasks') && global.race.hasOwnProperty('replicator') && Object.values(global.race.governor.tasks).includes('replicate') && global.race.governor.config.replicate.pow.on && global.race.replicator.pow > 0){
                return kw + global.race.replicator.pow;
            }
            return kw;
        },
        approx(kw){
            return +(kw).toFixed(2);
        },
        mRound(m){
            return +(m).toFixed(1);
        }
    }
});

popover('race',
    function(){
        return typeof races[global.race.species].desc === 'string' ? races[global.race.species].desc : races[global.race.species].desc();
    },{
        elm: '#race > .name'
    }
);

var moraleCap = 125;

popover('morale',
    function(obj){
        if (global.city.morale.unemployed !== 0){
            let type = global.city.morale.unemployed > 0 ? 'success' : 'danger';
            obj.popper.append(`<p class="modal_bd"><span>${loc(global.race['playful'] ? 'morale_hunter' : 'morale_unemployed')}</span> <span class="has-text-${type}"> ${+(global.city.morale.unemployed).toFixed(1)}%</span></p>`);
        }
        if (global.city.morale.stress !== 0){
            let type = global.city.morale.stress > 0 ? 'success' : 'danger';
            obj.popper.append(`<p class="modal_bd"><span>${loc('morale_stress')}</span> <span class="has-text-${type}"> ${+(global.city.morale.stress).toFixed(1)}%</span></p>`);
        }

        let total = 100 + global.city.morale.unemployed + global.city.morale.stress;
        Object.keys(global.city.morale).forEach(function (morale){
            if (!['current','unemployed','stress','season','cap','potential'].includes(morale) && global.city.morale[morale] !== 0){
                total += global.city.morale[morale];
                let type = global.city.morale[morale] > 0 ? 'success' : 'danger';

                let value = global.city.morale[morale];
                if (morale === 'entertain' && global.civic.govern.type === 'democracy'){
                    let democracy = 1 + (govEffect.democracy()[0] / 100);
                    value /= democracy;
                }

                let label = {  }

                obj.popper.append(`<p class="modal_bd"><span>${loc(`morale_${morale}`)}</span> <span class="has-text-${type}"> ${+(value).toFixed(1)}%</span></p>`)

                if (morale === 'entertain' && global.civic.govern.type === 'democracy'){
                    let democracy = govEffect.democracy()[0];
                    obj.popper.append(`<p class="modal_bd"><span>ᄂ${loc('govern_democracy')}</span> <span class="has-text-success"> +${democracy}%</span></p>`);
                }
            }
        });

        if (global.city.morale.season !== 0){
            total += global.city.morale.season;
            let season = global.city.calendar.season === 0 ? loc('morale_spring') : global.city.calendar.season === 1 ? loc('morale_summer') : loc('morale_winter');
            let type = global.city.morale.season > 0 ? 'success' : 'danger';
            obj.popper.append(`<p class="modal_bd"><span>${season}</span> <span class="has-text-${type}"> ${+(global.city.morale.season).toFixed(1)}%</span></p>`);
        }

        if (global.civic.govern.type === 'corpocracy'){
            let penalty = govEffect.corpocracy()[3];
            total -= penalty;
            obj.popper.append(`<p class="modal_bd"><span>${loc('govern_corpocracy')}</span> <span class="has-text-danger"> -${penalty}%</span></p>`);
        }
        if (global.civic.govern.type === 'republic'){
            let repub = govEffect.republic()[1];
            total += repub;
            obj.popper.append(`<p class="modal_bd"><span>${loc('govern_republic')}</span> <span class="has-text-success"> ${repub}%</span></p>`);
        }
        if (global.civic.govern.type === 'federation'){
            let fed = govEffect.federation()[1];
            total += fed;
            obj.popper.append(`<p class="modal_bd"><span>${loc('govern_federation')}</span> <span class="has-text-success"> ${fed}%</span></p>`);
        }

        let milVal = govActive('militant',1);
        if (milVal){
            total -= milVal;
            obj.popper.append(`<p class="modal_bd"><span>${loc('gov_trait_militant')}</span> <span class="has-text-danger"> -${milVal}%</span></p>`);
        }

        if (global.race['cheese']){
            let raw_cheese = global.stats.hasOwnProperty('reset') ? global.stats.reset + 1 : 1;
            let cheese = +(raw_cheese / (raw_cheese + 10) * 11).toFixed(2);
            total += cheese;
            obj.popper.append(`<p class="modal_bd"><span>${swissKnife(true,false)}</span> <span class="has-text-success"> ${cheese}%</span></p>`);
        }

        if (global.race['motivated']){
            let boost = Math.ceil(global.race['motivated'] ** 0.4);
            total += boost;
            obj.popper.append(`<p class="modal_bd"><span>${loc(`event_motivation_bd`)}</span> <span class="has-text-success"> ${boost}%</span></p>`);
        }

        if (global.race['artisan'] && global.civic.craftsman.workers > 0){
            let boost = +(traits.artisan.vars()[2] * global.civic.craftsman.workers).toFixed(2);
            total += boost;
            obj.popper.append(`<p class="modal_bd"><span>${loc(`trait_artisan_name`)}</span> <span class="has-text-success"> ${boost}%</span></p>`)
        }

        if (global.race['pet']){
            total += 1;
            obj.popper.append(`<p class="modal_bd"><span>${loc(`event_pet_${global.race.pet.type}_owner`)}</span> <span class="has-text-success"> ${1}%</span></p>`);
        }

        if (global.race['wishStats'] && global.race.wishStats.fame !== 0){
            total += global.race.wishStats.fame;
            if (global.race.wishStats.fame > 0){
                obj.popper.append(`<p class="modal_bd"><span>${loc(`wish_reputable`)}</span> <span class="has-text-success"> ${global.race.wishStats.fame}%</span></p>`);
            }
            else {
                obj.popper.append(`<p class="modal_bd"><span>${loc(`wish_notorious`)}</span> <span class="has-text-danger"> ${global.race.wishStats.fame}%</span></p>`);
            }
        }

        if (global.civic['homeless']){
            let homeless = global.civic.homeless / 2;
            total -= homeless;
            obj.popper.append(`<p class="modal_bd"><span>${loc(`homeless`)}</span> <span class="has-text-danger"> -${homeless}%</span></p>`);
        }

        if (global.tech['vax_c'] || global.tech['vax_f']){
            let drop = global.tech['vax_c'] ? 10 : 50;
            total -= drop;
            obj.popper.append(`<p class="modal_bd"><span>${loc(global.tech['vax_c'] ? `tech_vax_strat4_bd` : `tech_vax_strat2_bd`)}</span> <span class="has-text-danger"> -${drop}%</span></p>`);
        }
        else if (global.tech['vax_s']){
            let gain = 20;
            total += gain;
            obj.popper.append(`<p class="modal_bd"><span>${loc(`tech_vax_strat3_bd`)}</span> <span class="has-text-success"> ${gain}%</span></p>`);
        }

        if (global.city['tormented']){
            total -= global.city.tormented;
            obj.popper.append(`<p class="modal_bd"><span>${loc(`trait_tormented_name`)}</span> <span class="has-text-danger"> -${global.city.tormented}%</span></p>`);
        }

        if (global.race['wish'] && global.race['wishStats'] && global.race.wishStats.bad > 0){
            let badPress = Math.floor(global.race.wishStats.bad / 75) + 1;
            total -= badPress * 5;
            obj.popper.append(`<p class="modal_bd"><span>${loc(`wish_bad`)}</span> <span class="has-text-danger"> -${badPress * 5}%</span></p>`);
        }

        total = +(total).toFixed(1);

        let container = $(`<div></div>`);
        obj.popper.append(container);

        container.append(`<div class="modal_bd sum"><span>${loc('morale_total')}</span> <span class="has-text-warning"> ${+(total).toFixed(1)}%</span></div>`);
        container.append(`<div class="modal_bd"><span>${loc('morale_max')}</span> <span class="has-text-${total > moraleCap ? 'caution' : 'warning'}"> ${+(moraleCap).toFixed(1)}%</span></div>`);
        container.append(`<div class="modal_bd"><span>${loc('morale_current')}</span> <span class="has-text-warning"> ${+(global.city.morale.current).toFixed(1)}%</span></div>`);

        return undefined;
    },
    {
        classes: `has-background-light has-text-dark`
    }
);

popover('powerStatus',function(obj){
        let drain = +(global.city.power_total - global.city.power).toFixed(2);
        Object.keys(power_generated).forEach(function (k){
            if (power_generated[k]){
                let gen = +power_generated[k];
                obj.popper.append(`<p class="modal_bd"><span>${k}</span> <span class="has-text-success">+${+gen.toFixed(2)}</span></p>`);
            }
        });
        obj.popper.append(`<p class="modal_bd"><span>${loc('power_consumed')}</span> <span class="has-text-danger"> -${drain}</span></p>`);
        let avail = +(global.city.power).toFixed(2);
        if (global.city.power > 0){
            obj.popper.append(`<p class="modal_bd sum"><span>${loc('power_available')}</span> <span class="has-text-success">${avail}</span></p>`);
        }
        else {
            obj.popper.append(`<p class="modal_bd sum"><span>${loc('power_available')}</span> <span class="has-text-danger">${avail}</span></p>`);
        }
    },
    {
        classes: `has-background-light has-text-dark`
    }
);

if (global.settings.pause){
    $(`#pausegame`).addClass('pause');
}
else {
    $(`#pausegame`).addClass('play');
}

vBind({
    el: '#topBar',
    data: {
        city: global.city,
        race: global.race,
        s: global.settings
    },
    methods: {
        sign(){
            return seasonDesc('sign');
        },
        getAstroSign(){
            return seasonDesc('astrology');
        },
        weather(){
            return seasonDesc('weather');
        },
        temp(){
            return seasonDesc('temp');
        },
        moon(){
            return seasonDesc('moon');
        },
        season() {
            return seasonDesc('season');
        },
        showUniverse(){
            return global.race.universe === 'standard' || global.race.universe === 'bigbang' ? false : true;
        },
        showSim(){
            return global['sim'] ? true : false;
        },
        atRemain(){
            return loc(`accelerated_time`);
        },
        pause(){
            $(`#pausegame`).removeClass('play');
            $(`#pausegame`).removeClass('pause');
            if (global.settings.pause){
                global.settings.pause = false;
                $(`#pausegame`).addClass('play');
            }
            else {
                global.settings.pause = true;
                $(`#pausegame`).addClass('pause');
            }
            if (!global.settings.pause && !webWorker.s){
                gameLoop('start');
            }
        },
        pausedesc(){
            return global.settings.pause ? loc('game_play') : loc('game_pause');
        }
    },
    filters: {
        planet(species){
            return races[species].home;
        },
        universe(universe){
            return universe === 'standard' || universe === 'bigbang' ? '' : universe_types[universe].name;
        },
        remain(at){
            let minutes = Math.ceil(at * loopTimers().longTimer / 60000);
            if (minutes > 0){
                let hours = Math.floor(minutes / 60);
                minutes -= hours * 60;
                return `${hours}:${minutes.toString().padStart(2,'0')}`;
            }
            return;
        }
    }
});

['astroSign'].forEach(function(topId){
    popover(`${topId}`,function(){
        return seasonDesc('sign');
    }, {
        elm: $(`#${topId}`)
    });
});

popover('topBarPlanet',
    function(obj){
        if (global.race.species === 'protoplasm'){
            obj.popper.append($(`<span>${loc('infant')}</span>`));
        }
        else {
            let planet = races[global.race.species].home;
            let race = flib('name');
            let planet_label = biomes[global.city.biome].label;
            let trait = global.city.ptrait;
            if (trait.length > 0){
                let traits = '';
                trait.forEach(function(t){
                    if (planetTraits.hasOwnProperty(t)){
                        if (t === 'mellow' && global.race.species === 'entish'){
                            traits += `${loc('planet_mellow_eg')} `;
                        }
                        else {
                            traits += `${planetTraits[t].label} `;
                        }
                    }
                });
                planet_label = `${traits}${planet_label}`;
            }
            let orbit = orbitLength();

            let geo_traits = planetGeology(global.city.geology);

            let challenges = '';
            if (global.race['truepath']){
                challenges = challenges + `<div>${loc('evo_challenge_truepath_recap')}</div>`;
            }
            if (global.race['junker']){
                challenges = challenges + `<div>${loc('evo_challenge_junker_desc')} ${loc('evo_challenge_junker_conditions')}</div>`;
            }
            if (global.race['joyless']){
                challenges = challenges + `<div>${loc('evo_challenge_joyless_desc')} ${loc('evo_challenge_joyless_conditions')}</div>`;
            }
            if (global.race['steelen']){
                challenges = challenges + `<div>${loc('evo_challenge_steelen_desc')} ${loc('evo_challenge_steelen_conditions')}</div>`;
            }
            if (global.race['decay']){
                challenges = challenges + `<div>${loc('evo_challenge_decay_desc')} ${loc('evo_challenge_decay_conditions')}</div>`;
            }
            if (global.race['emfield']){
                challenges = challenges + `<div>${loc('evo_challenge_emfield_desc')} ${loc('evo_challenge_emfield_conditions')}</div>`;
            }
            if (global.race['inflation']){
                challenges = challenges + `<div>${loc('evo_challenge_inflation_desc')} ${loc('evo_challenge_inflation_conditions')}</div>`;
            }
            if (global.race['banana']){
                challenges = challenges + `<div>${loc('evo_challenge_banana_desc')} ${loc('wiki_achieve_banana1')}. ${loc('wiki_achieve_banana2')}. ${loc('wiki_achieve_banana3')}. ${loc('wiki_achieve_banana4',[500])}. ${loc('wiki_achieve_banana5',[50])}.</div>`;
            }
            if (global.race['witch_hunter']){
                challenges = challenges + `<div>${loc('evo_challenge_witch_hunter_desc')}</div>`;
            }
            if (global.race['nonstandard']){
                challenges = challenges + `<div>${loc('evo_challenge_nonstandard_desc')}</div>`;
            }
            if (global.race['gravity_well']){
                challenges = challenges + `<div>${loc('evo_challenge_gravity_well_desc')}</div>`;
            }
            if (global.race['warlord']){
                challenges = challenges + `<div>${loc('evo_challenge_warlord_desc')}</div>`;
            }
            if (global.race['fasting']){
                challenges = challenges + `<div>${loc('evo_challenge_fasting_desc')}</div>`;
            }
            if (global.race['lone_survivor']){
                challenges = challenges + `<div>${loc('evo_challenge_lone_survivor_desc')}</div>`;
            }
            if (global.race['sludge']){
                challenges = challenges + `<div>${loc('evo_challenge_sludge_desc')} ${loc('evo_challenge_sludge_conditions')}</div>`;
            }
            if (global.race['ultra_sludge']){
                challenges = challenges + `<div>${loc('evo_challenge_ultra_sludge_desc')} ${loc('evo_challenge_ultra_sludge_conditions')}</div>`;
            }
            if (global.race['orbit_decay']){
                let impact = global.race['orbit_decayed'] ? '' : loc('evo_challenge_orbit_decay_impact',[global.race['orbit_decay'] - global.stats.days]);
                let state = global.race['orbit_decayed'] ? (global.race['tidal_decay'] ? loc(`planet_kamikaze_msg`) : loc('evo_challenge_orbit_decay_impacted',[races[global.race.species].home])) : loc('evo_challenge_orbit_decay_desc');
                challenges = challenges + `<div>${state} ${loc('evo_challenge_orbit_decay_conditions')} ${impact}</div>`;
                if (calc_mastery() >= 100 && global.race.universe !== 'antimatter'){
                    challenges = challenges + `<div class="has-text-caution">${loc('evo_challenge_cataclysm_warn')}</div>`;
                }
                else {
                    challenges = challenges + `<div class="has-text-danger">${loc('evo_challenge_scenario_warn')}</div>`;
                }
            }

            if (global.race['cataclysm']){
                if (calc_mastery() >= 50 && global.race.universe !== 'antimatter'){
                    challenges = challenges + `<div>${loc('evo_challenge_cataclysm_desc')}</div><div class="has-text-caution">${loc('evo_challenge_cataclysm_warn')}</div>`;
                }
                else {
                    challenges = challenges + `<div>${loc('evo_challenge_cataclysm_desc')}</div><div class="has-text-danger">${loc('evo_challenge_scenario_warn')}</div>`;
                }
            }
            obj.popper.append($(`<div>${loc(global.race['cataclysm'] ? 'no_home' : 'home',[planet,race,planet_label,orbit])}</div>${geo_traits}${challenges}`));
        }
        return undefined;
    },
    {
        elm: `#topBar .planetWrap .planet`,
        classes: `has-background-light has-text-dark`
    }
);

popover('topBarUniverse',
    function(obj){
        obj.popper.append($(`<div>${universe_types[global.race.universe].desc}</div>`));
        obj.popper.append($(`<div>${universe_types[global.race.universe].effect}</div>`));
        return undefined;
    },
    {
        elm: `#topBar .planetWrap .universe`,
        classes: `has-background-light has-text-dark`
    }
);

popover('topBarSimulation',
    function(obj){
        obj.popper.append($(`<div>${loc(`evo_challenge_simulation_topbar`)}</div>`));
        return undefined;
    },
    {
        elm: `#topBar .planetWrap .simulation`,
        classes: `has-background-light has-text-dark`
    }
);

if (global.race['orbit_decay'] && !global.race['orbit_decayed']){
    popover(`infoTimer`, function(){
        return global.race['orbit_decayed'] ? '' : loc('evo_challenge_orbit_decay_impact',[global.race['orbit_decay'] - global.stats.days]);
    },
    {
        elm: `#infoTimer`,
        classes: `has-background-light has-text-dark`
    });
}

challengeIcon();

if (global.race.species === 'protoplasm'){
    global.resource.RNA.display = true;
    let perk_rank = global.stats.feat['master'] && global.stats.achieve['ascended'] && global.stats.achieve.ascended.l > 0 ? Math.min(global.stats.achieve.ascended.l,global.stats.feat['master']) : 0;
    if (global['sim']){ perk_rank = 5; }
    if (perk_rank > 0 && !global.evolution['mloaded']){
        let evolve_actions = ['dna','membrane','organelles','nucleus','eukaryotic_cell','mitochondria'];
        for (let i = 0; i < evolve_actions.length; i++) {
            if (!global.evolution[evolve_actions[i]]){
                global.evolution[evolve_actions[i]] = { count: 0 };
            }
        }
        global.evolution['dna'] = 1;
        global.resource.DNA.display = true;
        global.evolution.membrane.count = perk_rank * 2;
        global.evolution.eukaryotic_cell.count = perk_rank;
        global.evolution.mitochondria.count = perk_rank;
        global.evolution.organelles.count = perk_rank * 2;
        global.evolution.nucleus.count = perk_rank * 2;
        global.tech['evo'] = 2;
        global.evolution['mloaded'] = 1;
    }
    let grand_rank = global.stats.feat['grandmaster'] && global.stats.achieve['corrupted'] && global.stats.achieve.corrupted.l > 0 ? Math.min(global.stats.achieve.corrupted.l,global.stats.feat['grandmaster']) : 0;
    if (global['sim']){ grand_rank = 5; }
    if (grand_rank >= 5 && !global.evolution['gmloaded']){
        global.tech['evo'] = 6;
        global.evolution['gselect'] = true;
        global.evolution['gmloaded'] = 1;
        global.evolution['final'] = 80;
        global.tech['evo_humanoid'] = 1;
        global.tech['evo_giant'] = 1;
        global.tech['evo_small'] = 1;
        global.tech['evo_animalism'] = 2;
        global.tech['evo_demonic'] = 1;
        global.tech['evo_angelic'] = 1;
        global.tech['evo_insectoid'] = 1;
        global.tech['evo_eggshell'] = 2;
        global.tech['evo_eldritch'] = 1;
        global.tech['evo_sand'] = 1;
        global.tech['evo_polar'] = 1;
        global.tech['evo_heat'] = 1;
        global.tech['evo_fey'] = 1;
        global.tech['evo_aquatic'] = 1;
    }
    if (global.race.universe === 'bigbang'){
        global.seed = global.race.seed;
        setUniverse();
    }
    else if (global.race.seeded && !global.race['chose']){
        global.seed = global.race.seed;
        genPlanets();
    }
    else {
        drawEvolution();
    }
}
else {
    if (global.portal.hasOwnProperty('soul_forge') && global.portal.soul_forge.on){
        p_on['soul_forge'] = 1;
    }
    setWeather();
}

set_qlevel(calcQuantumLevel(true));

$('#lbl_city').html('Village');

if (window.Worker){
    webWorker.w = new Worker("evolve/evolve.js");
    webWorker.w.addEventListener('message', function(e){
        var data = e.data;
        switch (data) {
            case 'fast':
                fastLoop();
                break;
            case 'mid':
                midLoop();
                break;
            case 'long':
                longLoop();
                break;
        }
    }, false);
}
gameLoop('start');

resourceAlt();

var firstRun = true;
var gene_sequence = global.arpa['sequence'] && global.arpa['sequence']['on'] ? global.arpa.sequence.on : 0;
function fastLoop(){
    if (!global.race['no_craft']){
        $('.craft').each(function(e){
            if (typeof $(this).data('val') === 'number'){
                $(this).html(sizeApproximation($(this).data('val') * keyMultiplier(),1));
            }
        });
    }

    const date = new Date();
    const astroSign = astrologySign();
    breakdown.p['Global'] = {};
    var global_multiplier = 1;
    let applyPlasmid = false;
    let pBonus = plasmidBonus('raw');
    if (global.prestige.Plasmid.count > 0 && ((global.race.universe !== 'antimatter') || (global.genes['bleed'] && global.race.universe === 'antimatter'))){
        breakdown.p['Global'][loc('resource_Plasmid_name')] = (pBonus[1] * 100) + '%';
        applyPlasmid = true;
    }
    if (global.prestige.AntiPlasmid.count > 0 && ((global.race.universe === 'antimatter') || (global.genes['bleed'] && global.genes['bleed'] >= 2 && global.race.universe !== 'antimatter'))){
        breakdown.p['Global'][loc('resource_AntiPlasmid_name')] = (pBonus[2] * 100) + '%';
        applyPlasmid = true;
    }
    if (applyPlasmid){
        global_multiplier += pBonus[0];
    }
    if (global.prestige.Supercoiled.count > 0){
        let bonus = (global.prestige.Supercoiled.count / (global.prestige.Supercoiled.count + 5000));
        breakdown.p['Global'][loc('resource_Supercoiled_short')] = +(bonus * 100).toFixed(2) + '%';
        global_multiplier *= (1 + bonus);
    }
    if (global.race['no_plasmid'] || global.race.universe === 'antimatter'){
        if (((global.race['cataclysm'] || global.race['orbit_decayed']) && global.space['ziggurat'] && templeCount(true)) || (global.city['temple'] && global.city['temple'].count)){
            let faith = faithBonus();
            breakdown.p['Global'][loc('faith')] = (faith * 100) + '%';
            global_multiplier *= (1 + faith);
        }
    }
    if (global.race.universe === 'evil' && global.resource.Authority.display){
        if (global.resource.Authority.amount < 100){
            let malus = (100 - global.resource.Authority.amount) * 0.0035;
            breakdown.p['Global'][global.resource.Authority.name] = -(malus * 100).toFixed(2) + '%';
            global_multiplier *= (1 - malus);
        }
        else if (global.resource.Authority.amount > 100){
            let bonus = (global.resource.Authority.amount - 100) * 0.0015;
            breakdown.p['Global'][global.resource.Authority.name] = +(bonus * 100).toFixed(2) + '%';
            global_multiplier *= (1 + bonus);
        }
    }
    if (global.race['untapped']){
        if (global.race['untapped'] > 0){
            let untapped = +(global.race.untapped / (global.race.untapped + 20) / 10 + 0.00024).toFixed(4);
            breakdown.p['Global'][loc('trait_untapped_bd')] = `${untapped * 100}%`;
            global_multiplier *= 1 + (untapped);
        }
    }
    if (global.race['overtapped'] && global.race.overtapped > 0){
        let overtapped = +(global.race.overtapped * 0.01).toFixed(3);
        breakdown.p['Global'][loc('trait_overtapped_bd')] = `-${overtapped * 100}%`;
        global_multiplier *= 1 - (overtapped);
    }
    if (global.race['rainbow_active'] && global.race['rainbow_active'] > 1){
        breakdown.p['Global'][loc('trait_rainbow_bd')] = `${traits.rainbow.vars()[0]}%`;
        global_multiplier *= 1 + (traits.rainbow.vars()[0] / 100);
    }
    if (global.race['gloomy'] && global.city.calendar.weather <= 1){
        breakdown.p['Global'][loc('trait_gloomy_name')] = `${traits.gloomy.vars()[0]}%`;
        global_multiplier *= 1 + (traits.gloomy.vars()[0] / 100);
    }
    if (global.race['floating'] && global.city.calendar.wind === 1){
        breakdown.p['Global'][loc('trait_floating_name')] = `-${traits.floating.vars()[0]}%`;
        global_multiplier *= 1 - (traits.floating.vars()[0] / 100);
    }
    if (global.tech['world_control']){
        let bonus = 25;
        if (global.civic.govern.type === 'federation'){
            bonus = govEffect.federation()[2];
        }
        if (global.race['unified']){
            bonus += traits.unified.vars()[0];
        }
        if (astroSign === 'taurus'){
            bonus += astroVal('taurus')[0];
        }
        breakdown.p['Global'][loc('tech_unification')] = `${bonus}%`;
        global_multiplier *= 1 + (bonus / 100);
    }
    else {
        let occupy = 0;
        for (let i=0; i<3; i++){
            if (global.civic.foreign[`gov${i}`].occ || global.civic.foreign[`gov${i}`].anx || global.civic.foreign[`gov${i}`].buy){
                occupy += global.civic.govern.type === 'federation' ? (5 + govEffect.federation()[0]) : 5;
            }
        }
        if (occupy > 0){
            breakdown.p['Global'][loc('civics_garrison_occupy')] = `${occupy}%`;
            global_multiplier *= 1 + (occupy / 100);
        }
    }
    if (global.genes['challenge'] && global.genes.challenge >= 2){
        let mastery = calc_mastery();
        breakdown.p['Global'][loc('mastery')] = mastery + '%';
        global_multiplier *= 1 + (mastery / 100);
    }
    if (global['pillars']){
        let harmonic = calcPillar();
        breakdown.p['Global'][loc('harmonic')] = `${(harmonic[0] - 1) * 100}%`;
        global_multiplier *= harmonic[0];
    }
    if (global.race['ascended']){
        breakdown.p['Global'][loc('achieve_ascended_name')] = `5%`;
        global_multiplier *= 1.05;
    }
    if (global.race['corruption']){
        let corruption = global.race['corruption'] * 2;
        breakdown.p['Global'][loc('achieve_corrupted_name')] = `${corruption}%`;
        global_multiplier *= 1 + (corruption / 100);
    }
    if (global.race['rejuvenated']){
        let decay = global.stats.days < 996 ? (1000 - global.stats.days) / 2000 : 0.02;
        breakdown.p['Global'][loc('rejuvenated')] = `${decay * 100}%`;
        global_multiplier *= 1 + decay;
    }
    let octFathom = fathomCheck('octigoran');
    if (global.race['suction_grip'] || octFathom > 0){
        let bonus = 0;
        if (global.race['suction_grip']){
            bonus += traits.suction_grip.vars()[0];
        }
        if (octFathom > 0){
            bonus += +(traits.suction_grip.vars(1)[0] * octFathom).toFixed(2);
        }
        breakdown.p['Global'][loc('trait_suction_grip_bd')] = bonus+'%';
        global_multiplier *= 1 + (bonus / 100);
    }

    let cyclopsFathom = fathomCheck('cyclops');
    if (global.race['intelligent'] || cyclopsFathom > 0){
        let bonus = 0;
        if (global.race['intelligent']){
            bonus += (workerScale(global.civic.scientist.workers,'scientist') * traits.intelligent.vars()[1]) + (workerScale(global.civic.professor.workers,'professor') * traits.intelligent.vars()[0]);
        }
        if (cyclopsFathom > 0){
            bonus += (workerScale(global.civic.scientist.workers,'scientist') * traits.intelligent.vars(1)[1] * cyclopsFathom) + (workerScale(global.civic.professor.workers,'professor') * traits.intelligent.vars(1)[0] * cyclopsFathom);
        }
        if (global.race['high_pop']){
            bonus = highPopAdjust(bonus);
        }
        breakdown.p['Global'][loc('trait_intelligent_bd')] = bonus+'%';
        global_multiplier *= 1 + (bonus / 100);
    }
    if (global.race['slaver'] && global.city['slave_pen'] && global.city['slave_pen']){
        let bonus = (global.resource.Slave.amount * traits.slaver.vars()[0]);
        breakdown.p['Global'][loc('trait_slaver_bd')] = bonus+'%';
        global_multiplier *= 1 + (bonus / 100);
    }
    if ((global.city.ptrait.includes('trashed') || global.race['scavenger'] || (global.race['servants'] && global.race.servants['force_scavenger'])) && global.civic['scavenger']){
        let scavenger = global.city.ptrait.includes('trashed') || global.race['scavenger'] ? workerScale(global.civic.scavenger.workers,'scavenger') : 0;
        if (global.race['servants']){ scavenger += jobScale(global.race.servants.jobs.scavenger); }
        if (scavenger > 0){
            let bonus = (scavenger * traits.scavenger.vars()[0]);
            if (global.city.ptrait.includes('trashed') && global.race['scavenger']){
                bonus *= 1 + (traits.scavenger.vars()[1] / 100);
            }
            if (global.city.ptrait.includes('trashed')){
                bonus *= planetTraits.trashed.vars()[1];
            }
            if (global.race['high_pop']){
                bonus = highPopAdjust(bonus);
            }
            breakdown.p['Global'][loc('job_scavenger')] = bonus+'%';
            global_multiplier *= 1 + (bonus / 100);
        }
    }
    if (global.race['unfathomable'] && global.city['surfaceDwellers'] && global.city['captive_housing']){
        let thralls = 0;
        let rank = global.stats.achieve['nightmare'] && global.stats.achieve.nightmare['mg'] ? global.stats.achieve.nightmare.mg : 0;
        if (global.city.hasOwnProperty('surfaceDwellers')){
            for (let i = 0; i < global.city.surfaceDwellers.length; i++){
                thralls += global.city.captive_housing[`race${i}`];
            }
            if (thralls > global.civic.torturer.workers * rank / 2){
                let unsupervised = thralls - (global.civic.torturer.workers * rank / 2);
                thralls -= Math.ceil(unsupervised / 3);
            }
        }
        if (thralls > 0){
            let bonus = (thralls * traits.unfathomable.vars()[2] * rank / 5);
            if (global.race['psychic']){
                bonus *= 1 + (traits.psychic.vars()[1] / 100);
            }
            breakdown.p['Global'][loc('trait_unfathomable_bd')] = bonus+'%';
            global_multiplier *= 1 + (bonus / 100);
        }
    }
    if (global.city.ptrait.includes('mellow')){
        breakdown.p['Global'][loc('planet_mellow_bd')] = '-' + (100 - (planetTraits.mellow.vars()[2] * 100)) + '%';
        global_multiplier *= planetTraits.mellow.vars()[2];
    }
    if (global.city.ptrait.includes('ozone') && global.city['sun']){
        let uv = global.city['sun'] * planetTraits.ozone.vars()[0];
        breakdown.p['Global'][loc('planet_ozone_bd')] = `-${uv}%`;
        global_multiplier *= 1 - (uv / 100);
    }
    let phoenixFathom = fathomCheck('phoenix');
    if ((global.race['smoldering'] || phoenixFathom > 0) && global.city['hot']){
        let heat = 0;
        if (global.race['smoldering']){
            if (global.city['hot'] > 100){
                heat += 100 * traits.smoldering.vars()[1];
                heat += (global.city['hot'] - 100) * traits.smoldering.vars()[2];
            }
            else {
                heat += global.city['hot'] * traits.smoldering.vars()[1];
            }
        }
        if (phoenixFathom > 0){
            if (global.city['hot'] > 100){
                heat += 100 * traits.smoldering.vars(0.25)[1] * phoenixFathom;
                heat += (global.city['hot'] - 100) * traits.smoldering.vars(0.25)[2] * phoenixFathom;
            }
            else {
                heat += global.city['hot'] * traits.smoldering.vars(0.25)[1] * phoenixFathom;
            }
        }
        breakdown.p['Global'][loc('trait_smoldering_name')] = `${heat}%`;
        global_multiplier *= 1 + (heat / 100);
    }
    if (global.race['heat_intolerance'] && global.city['hot']){
        let heat = global.city['hot'] * traits.heat_intolerance.vars()[0];
        breakdown.p['Global'][loc('hot')] = `-${heat}%`;
        global_multiplier *= 1 - (heat / 100);
    }
    if (global.race['chilled'] && global.city['cold']){
        let cold = 0;
        if (global.city['cold'] > 100){
            cold += 100 * traits.chilled.vars()[1];
            cold += (global.city['cold'] - 100) * traits.chilled.vars()[2];
        }
        else {
            cold = global.city['cold'] * traits.chilled.vars()[1];
        }
        breakdown.p['Global'][loc('trait_chilled_name')] = `${cold}%`;
        global_multiplier *= 1 + (cold / 100);
    }
    if (global.race['cold_intolerance'] && global.city['cold']){
        let cold = global.city['cold'] * traits.cold_intolerance.vars()[0];
        breakdown.p['Global'][loc('cold')] = `-${cold}%`;
        global_multiplier *= 1 - (cold / 100);
    }
    if (global.civic.govern.type === 'anarchy' && global.resource[global.race.species].amount >= jobScale(10)){
        let chaos = (global.resource[global.race.species].amount - (jobScale(10) - 1)) * (global.race['high_pop'] ? (0.25 / traits.high_pop.vars()[0]) : 0.25);
        breakdown.p['Global'][loc('govern_anarchy')] = `-${chaos}%`;
        global_multiplier *= 1 - (chaos / 100);
    }
    if (global.civic.govern['protest'] && global.civic.govern.protest > 0){
        breakdown.p['Global'][loc('event_protest')] = `-${30}%`;
        global_multiplier *= 0.7;
    }
    if (global.civic.govern['scandal'] && global.civic.govern.scandal > 0){
        let muckVal = govActive('muckraker',0);
        if (muckVal){
            breakdown.p['Global'][loc('event_scandal')] = `-${muckVal}%`;
            global_multiplier *= 1 - (muckVal / 100);
        }
    }
    let capyFathom = fathomCheck('capybara');
    if (capyFathom > 0 || (global.race['calm'] && global.city['meditation'] && global.resource.Zen.display)){
        let rawZen = global.resource.Zen.amount;
        if (capyFathom > 0){
            rawZen += Math.round(capyFathom * 500);
        }
        let zen = rawZen / (rawZen + 5000);
        breakdown.p['Global'][loc('trait_calm_bd')] = `+${(zen * 100).toFixed(2)}%`;
        global_multiplier *= 1 + zen;
    }
    if (global.city['firestorm'] && global.city.firestorm > 0){
        global.city.firestorm--;
        breakdown.p['Global'][loc('event_flare_bd')] = `-${20}%`;
        global_multiplier *= 0.8;
    }

    if (
        (races[global.race.species].type === 'aquatic' && !['swamp','oceanic'].includes(global.city.biome)) ||
        (races[global.race.species].type === 'fey' && !['forest','swamp','taiga'].includes(global.city.biome)) ||
        (races[global.race.species].type === 'heat' && !['ashland','volcanic'].includes(global.city.biome)) ||
        (races[global.race.species].type === 'polar' && !['tundra','taiga'].includes(global.city.biome)) ||
        (races[global.race.species].type === 'sand' && !['ashland','desert'].includes(global.city.biome)) ||
        (races[global.race.species].type === 'demonic' && global.city.biome !== 'hellscape') ||
        (races[global.race.species].type === 'angelic' && global.city.biome !== 'eden')
    ){
        let unsuited = 1;
        if (global.blood['unbound'] && global.blood.unbound >= 4){
            unsuited = global.race['rejuvenated'] ? 0.975 : 0.95;
        }
        else if (global.blood['unbound'] && global.blood.unbound >= 2){
            unsuited = global.race['rejuvenated'] ? 0.95 : 0.9;
        }
        else {
            unsuited = global.race['rejuvenated'] ? 0.9 : 0.8;
        }

        breakdown.p['Global'][loc('unsuited')] = `-${Math.round((1 - unsuited) * 100)}%`;
        global_multiplier *= unsuited;
    }

    if (global.race['hibernator'] && global.city.calendar.season === 3){
        global_multiplier *= 1 - (traits.hibernator.vars()[1] / 100);
        breakdown.p['Global'][loc('morale_winter')] = `-${traits.hibernator.vars()[1]}%`;
    }

    if (global.race.universe === 'magic' && global.tech['syphon']){
        let entropy = global.tech.syphon / 8;
        breakdown.p['Global'][loc('arpa_syphon_damage')] = `-${entropy}%`;
        global_multiplier *= 1 - (entropy / 100);
    }

    let resList = [
        'Money','Knowledge','Omniscience','Food','Lumber','Stone','Chrysotile','Crystal','Furs','Copper','Iron',
        'Cement','Coal','Oil','Uranium','Aluminium','Steel','Titanium','Alloy','Polymer','Iridium','Helium_3',
        'Water','Deuterium','Neutronium','Adamantite','Infernite','Elerium','Nano_Tube','Graphene','Stanene',
        'Bolognium','Vitreloy','Orichalcum','Asphodel_Powder','Elysanite','Unobtainium','Quantium',
        'Plywood','Brick','Wrought_Iron','Sheet_Metal','Mythril','Aerogel','Nanoweave','Scarletite',
        'Cipher','Nanite','Mana','Authority'
    ];

    breakdown.p['consume'] = {};
    resList.forEach(function(res){
        breakdown.p['consume'][res] = {};
        breakdown.p[res] = {};
    });
    if(global.race['fasting']){
        breakdown.p['consume'][global.race.species] = {};
        breakdown.p[global.race.species] = {};
    }

    var time_multiplier = 0.25;

    if (global.race.species === 'protoplasm'){
        // Early Evolution Game

        // Gain RNA & DNA
        if (global.evolution['nucleus'] && global['resource']['DNA'].amount < global['resource']['DNA'].max){
            var increment = global.evolution['nucleus'].count;
            while (global['resource']['RNA'].amount < increment * 2){
                increment--;
                if (increment <= 0){ break; }
            }
            let rna = increment;
            if (global.tech['evo'] && global.tech.evo >= 5){
                increment *= 2;
            }
            modRes('DNA', increment * global_multiplier * time_multiplier);
            modRes('RNA', -(rna * 2 * time_multiplier));
        }
        if (global.evolution['organelles']){
            let rna_multiplier = global.race['rapid_mutation'] ? 2 : 1;
            if (global.tech['evo'] && global.tech.evo >= 2){
                rna_multiplier++;
            }
            modRes('RNA',global.evolution['organelles'].count * rna_multiplier * global_multiplier * time_multiplier);
        }

        if (((global.stats.feat['novice'] && global.stats.achieve['apocalypse'] && global.stats.achieve.apocalypse.l > 0) || global['sim']) && global.race.universe !== 'bigbang' && (!global.race.seeded || (global.race.seeded && global.race['chose']))){
            let rank = global['sim'] ? 5 : Math.min(global.stats.achieve.apocalypse.l,global.stats.feat['novice']);
            modRes('RNA', (rank / 2) * time_multiplier * global_multiplier);
            if (global.resource.DNA.display){
                modRes('DNA', (rank / 4) * time_multiplier * global_multiplier);
            }
        }
        // Detect new unlocks
        if (global['resource']['RNA'].amount >= 2 && !global.evolution['dna']){
            global.evolution['dna'] = 1;
            global.resource.DNA.display = true;
            if (global.stats.achieve['mass_extinction'] && global.stats.achieve['mass_extinction'].l > 1){
                modRes('RNA', global.resource.RNA.max);
                modRes('DNA', global.resource.RNA.max);
            }
            drawEvolution();
        }
        else if (global['resource']['RNA'].amount >= 10 && !global.evolution['membrane']){
            global.evolution['membrane'] = { count: 0 };
            drawEvolution();
        }
        else if (global['resource']['DNA'].amount >= 4 && !global.evolution['organelles']){
            global.evolution['organelles'] = { count: 0 };
            drawEvolution();
        }
        else if (global.evolution['organelles'] && global.evolution.organelles.count >= 2 && !global.evolution['nucleus']){
            global.evolution['nucleus'] = { count: 0 };
            drawEvolution();
        }
        else if (global.evolution['nucleus'] && global.evolution.nucleus.count >= 1 && !global.evolution['eukaryotic_cell']){
            global.evolution['eukaryotic_cell'] = { count: 0 };
            drawEvolution();
        }
        else if (global.evolution['eukaryotic_cell'] && global.evolution.eukaryotic_cell.count >= 1 && !global.evolution['mitochondria']){
            global.evolution['mitochondria'] = { count: 0 };
            drawEvolution();
        }
        else if (global.evolution['mitochondria'] && !global.tech['evo']){
            global.tech['evo'] = 1;
            drawEvolution();
        }
    }
    else {
        // Rest of game
        let zigVal = zigguratBonus();
        let morale = 100;
        let q_multiplier = 1;
        let qs_multiplier = 1;
        if (global.race['quarantine'] && global.race['qDays']){
            let qDays = 1 - ((global.race.qDays <= 1000 ? global.race.qDays : 1000) / 1000);
            switch (global.race.quarantine){
                case 1:
                    q_multiplier = 0.5 + (0.5 * qDays);
                    break;
                case 2:
                    q_multiplier = 0.25 + (0.25 * qDays);
                    qs_multiplier = 0.5 + (0.5 * qDays);
                    break;
                case 3:
                    q_multiplier = 0.1 + (0.15 * qDays);
                    qs_multiplier = 0.25 + (0.25 * qDays);
                    break;
                case 4:
                    q_multiplier = 0.08 + (0.02 * qDays);;
                    qs_multiplier = 0.12 + (0.13 * qDays);;
                    break;
            }

            if (global.race['vax'] && global.tech['focus_cure'] && global.tech.focus_cure >= 4){
                let vax = +global.race.vax.toFixed(2) / 100;
                if (vax > 1){ vax = 1; }
                q_multiplier = q_multiplier + ((1 - q_multiplier) * vax);
                qs_multiplier = qs_multiplier + ((1 - qs_multiplier) * vax);
            }
        }

        if (global.city.calendar.season === 0 && global.city.calendar.year > 0){ // Spring
            let spring = global.race['chilled'] || global.race['smoldering'] ? 0 : 5;
            morale += spring;
            global.city.morale.season = spring;
        }
        else if (global.city.calendar.season === 1 && global.race['smoldering']){ // Summer
            morale += traits.smoldering.vars()[0];
            global.city.morale.season = traits.smoldering.vars()[0];
        }
        else if (global.city.calendar.season === 3){ // Winter
            if (global.race['chilled']){
                morale += traits.chilled.vars()[0];
                global.city.morale.season = traits.chilled.vars()[0];
            }
            else {
                morale -= global.race['leathery'] ? traits.leathery.vars()[0] : 5;
                global.city.morale.season = global.race['leathery'] ? -(traits.leathery.vars()[0]) : -5;
            }
        }
        else {
            global.city.morale.season = 0;
        }

        if (global.race['cheese']){
            let raw_cheese = global.stats.hasOwnProperty('reset') ? global.stats.reset + 1 : 1;
            let cheese = +(raw_cheese / (raw_cheese + 10) * 11).toFixed(2);
            morale += cheese;
        }

        if (global.civic['homeless']){
            morale -= global.civic.homeless / 2;
        }

        if (global.tech['vax_c'] || global.tech['vax_f']){
            morale -= global.tech['vax_c'] ? 10 : 50;
        }
        else if (global.tech['vax_s']){
            morale += 20;
        }

        if (global.tech['m_boost']){
            global.city.morale.leadership = 20;
            morale += 20;
        }
        else {
            global.city.morale.leadership = 0;
        }

        if (shrineBonusActive()){
            let shrineMorale = getShrineBonus('morale');
            global.city.morale.shrine = shrineMorale.add;
            morale += shrineMorale.add;
        }
        else {
            global.city.morale.shrine = 0;
        }

        let milVal = govActive('militant',1);
        if (milVal){
            morale -= milVal;
        }
        if (global.civic.govern.type === 'corpocracy'){
            morale -= govEffect.corpocracy()[3];
        }
        if (global.civic.govern.type === 'republic'){
            morale += govEffect.republic()[1];
        }
        if (global.civic.govern.type === 'federation'){
            morale += govEffect.federation()[1];
        }

        if (global.race['blood_thirst'] && global.race.blood_thirst_count >= 1){
            let blood_thirst = Math.ceil(Math.log2(global.race.blood_thirst_count));
            global.city.morale.blood_thirst = blood_thirst;
            morale += blood_thirst;
        }
        else {
            global.city.morale.blood_thirst = 0;
        }

        let weather_morale = 0;
        if (global.city.calendar.weather === 0){
            if (global.city.calendar.temp > 0){
                if (global.city.calendar.wind === 1){
                    // Thunderstorm
                    if (global.race['skittish']){
                        weather_morale = -(traits.skittish.vars()[0]);
                    }
                    else {
                        weather_morale = global.race['leathery'] ? -(traits.leathery.vars()[0]) : -5;
                    }
                }
                else {
                    // Rain
                    weather_morale = global.race['leathery'] ? 0 : -2;
                }
            }
        }
        else if (global.city.calendar.weather === 2){
            // Sunny
            if (global.race['nyctophilia']){
                weather_morale = -(traits.nyctophilia.vars()[0]);
            }
            else if ((global.city.calendar.wind === 0 && global.city.calendar.temp < 2) || (global.city.calendar.wind === 1 && global.city.calendar.temp === 2)){
                //Still and Not Hot
                // -or-
                //Windy and Hot
                weather_morale = 2;
            }
        }
        else {
            //Cloudy
            if (global.race['nyctophilia']){
                weather_morale = traits.nyctophilia.vars()[1];
            }
        }
        if (global.race['snowy'] && (global.city.calendar.temp !== 0 || global.city.calendar.weather !== 0)){
            weather_morale -= global.city.calendar.temp >= 2 ? traits.snowy.vars()[1] : traits.snowy.vars()[0];
        }

        global.city.morale.weather = global.race['submerged'] ? 0 : weather_morale;
        morale += global.race['submerged'] ? 0 : weather_morale;

        if (global.race['motivated']){
            let boost = Math.ceil(global.race['motivated'] ** 0.4);
            morale += boost;
        }

        if (global.race['pet']){
            morale += 1;
        }

        if (global.race['wish'] && global.race['wishStats'] && global.race.wishStats.fame !== 0){
            morale += global.race.wishStats.fame;
        }

        if (global.race['artisan'] && !global.race['joyless']){
            morale += traits.artisan.vars()[2] * global.civic.craftsman.workers;
        }

        let stress = 0;

        let divisor = 5;
        global.city.morale.unemployed = 0;
        if (!global.city.ptrait.includes('mellow')){
            let unemployed = global.civic.unemployed.workers / (global.race['high_pop'] ? traits.high_pop.vars()[0] : 1);
            morale -= unemployed;
            global.city.morale.unemployed = -(unemployed);
        }
        else {
            divisor *= planetTraits.mellow.vars()[0];
        }

        let vulFathom = fathomCheck('vulpine');
        if (global.civic.hunter.display && (global.race['playful'] || vulFathom > 0)){
            let val = 0;
            if (vulFathom > 0){
                val += traits.playful.vars(1)[0] * vulFathom;
            }
            if (global.race['playful']){
                val += traits.playful.vars()[0];
            }
            morale += global.civic.hunter.workers * val;
            global.city.morale.unemployed = global.civic.hunter.workers * val;
        }
        else {
            stress -= global.civic.hunter.workers / divisor;
        }

        if (global.race['optimistic']){
            stress += traits.optimistic.vars()[0];
        }
        let geckoFathom = fathomCheck('gecko');
        if (geckoFathom > 0){
            stress += traits.optimistic.vars(1)[0] * geckoFathom;
        }

        if (global.race['pessimistic']){
            stress -= traits.pessimistic.vars()[0];
        }

        if (global.civic['garrison']){
            let divisor = 2;
            if (global.city.ptrait.includes('mellow')){
                divisor *= planetTraits.mellow.vars()[0];
            }
            let army_stress = global.civic.garrison.max / divisor;
            if (global.race['high_pop']){
                army_stress /= traits.high_pop.vars()[0]
            }

            stress -= army_stress;
        }

        breakdown.p.consume.Money[loc('trade')] = 0;

        // trade routes
        if (global.tech['trade'] || (global.race['banana'] && global.tech['primitive'] && global.tech.primitive >= 3)){
            let used_trade = 0;
            let dealVal = govActive('dealmaker',0);
            if (dealVal){
                let exporting = 0;
                let importing = 0;
                Object.keys(global.resource).forEach(function(res){
                    if (global.resource[res].hasOwnProperty('trade') && global.resource[res].trade < 0){
                        exporting -= global.resource[res].trade;
                    }
                    if (global.resource[res].hasOwnProperty('trade') && global.resource[res].trade > 0){
                        importing += global.resource[res].trade;
                    }
                });
                if (exporting < importing){
                    Object.keys(global.resource).forEach(function(res){
                        global.resource[res].trade = 0;
                    });
                }
            }
            Object.keys(global.resource).forEach(function (res){
                if (global.resource[res].trade > 0){
                    used_trade += global.resource[res].trade;
                    let price = tradeBuyPrice(res) * global.resource[res].trade;

                    if (global.resource.Money.amount >= price * time_multiplier){
                        let rate = tradeRatio[res];
                        if (dealVal){
                            rate *= 1 + (dealVal / 100);
                        }
                        if (global.race['persuasive']){
                            rate *= 1 + (traits.persuasive.vars()[0] * global.race['persuasive'] / 100);
                        }
                        if (global.race['merchant']){
                            rate *= 1 + (traits.merchant.vars()[1] / 100);
                        }
                        if (global.race['ocular_power'] && global.race['ocularPowerConfig'] && global.race.ocularPowerConfig.c){
                            let trade = 70 * (traits.ocular_power.vars()[1] / 100);
                            rate *= 1 + (trade / 100);
                        }
                        let fathom = fathomCheck('goblin');
                        if (fathom > 0){
                            rate *= 1 + (traits.merchant.vars(1)[1] / 100 * fathom);
                        }
                        if (astroSign === 'capricorn'){
                            rate *= 1 + (astroVal('capricorn')[0] / 100);
                        }
                        if (global.race['devious']){
                            rate *= 1 - (traits.devious.vars()[0] / 100);
                        }
                        if (global.genes['trader']){
                            let mastery = calc_mastery();
                            rate *= 1 + (mastery / 100);
                            if (global.genes.trader >= 2){
                                let coiled = global.prestige.Supercoiled.count;
                                rate *= 1 + (coiled / (coiled + 500));
                            }
                        }
                        if (global.stats.achieve.hasOwnProperty('trade')){
                            let rank = global.stats.achieve.trade.l * 2;
                            if (rank > 10){ rank = 10; }
                            rate *= 1 + (rank / 100);
                        }
                        if (global.race['truepath']){
                            rate *= 1 - (global.civic.foreign.gov3.hstl / 101);
                        }
                        modRes(res,global.resource[res].trade * time_multiplier * rate);
                        modRes('Money', -(price * time_multiplier));
                        breakdown.p.consume.Money[loc('trade')] -= price;
                        breakdown.p.consume[res][loc('trade')] = global.resource[res].trade * rate;
                    }
                    steelCheck();
                }
                else if (global.resource[res].trade < 0){
                    used_trade -= global.resource[res].trade;
                    let price = tradeSellPrice(res) * global.resource[res].trade;

                    let rate = tradeRatio[res];
                    if (global.stats.achieve.hasOwnProperty('trade')){
                        let rank = global.stats.achieve.trade.l;
                        if (rank > 5){ rank = 5; }
                        rate *= 1 - (rank / 100);
                    }

                    if (global.resource[res].amount >= rate * time_multiplier){
                        modRes(res,global.resource[res].trade * time_multiplier * rate);
                        modRes('Money', -(price * time_multiplier));
                        breakdown.p.consume.Money[loc('trade')] -= price;
                        breakdown.p.consume[res][loc('trade')] = global.resource[res].trade * rate;
                    }
                    steelCheck();
                }
            });
            global.city.market.trade = used_trade;
        }
        if (breakdown.p.consume.Money[loc('trade')] === 0){
            delete breakdown.p.consume.Money[loc('trade')];
        }

        // alchemy
        if (global.tech['alchemy']){
            let totMana = 0;
            let totCrystal = 0;
            let totTransmute = 0;
            Object.keys(global.race.alchemy).forEach(function (res){
                if (global.race.alchemy[res] > 0){
                    let trasmute = Number(global.race.alchemy[res]);
                    if (global.resource.Mana.amount < trasmute){
                        trasmute = global.resource.Mana.amount;
                    }
                    if (global.resource.Crystal.amount < trasmute * 0.15){
                        trasmute = Math.floor(global.resource.Crystal.amount * (1/0.15));
                    }
                    totTransmute += trasmute;

                    if (trasmute >= time_multiplier){
                        let rate = global.resource[res].basic && global.tech.alchemy >= 2 ? tradeRatio[res] * 8 : tradeRatio[res] * 2;
                        if (global.race['witch_hunter']){ rate *= 3; }
                        if (global.stats.achieve['soul_sponge'] && global.stats.achieve.soul_sponge['mg']){
                            rate *= global.stats.achieve.soul_sponge.mg + 1;
                        }
                        modRes(res,trasmute * time_multiplier * rate);
                        modRes('Mana', -(trasmute * time_multiplier));
                        modRes('Crystal', -(trasmute * 0.15 * time_multiplier));
                        totMana -= trasmute;
                        totCrystal -= trasmute * 0.15;
                        breakdown.p.consume[res][loc('tab_alchemy')] = trasmute * rate;
                        if (global.race.universe === 'magic' && !global.resource[res].basic && global.tech.alchemy >= 2){
                            unlockAchieve('fullmetal');
                        }
                    }
                }
            });
            global.race['totTransmute'] = totTransmute;
            breakdown.p.consume.Mana[loc('tab_alchemy')] = totMana;
            breakdown.p.consume.Crystal[loc('tab_alchemy')] = totCrystal;
        }

        if (global.galaxy['trade'] && (gal_on.hasOwnProperty('freighter') || gal_on.hasOwnProperty('super_freighter'))){
            let cap = 0;
            if (global.galaxy['freighter']){
                cap += gal_on['freighter'] * 2;
            }
            if (global.galaxy['super_freighter']){
                cap += gal_on['super_freighter'] * 5;
            }
            global.galaxy.trade.max = cap;

            let used = 0;
            let offers = galaxyOffers();
            for (let i=0; i<offers.length; i++){
                let exprt_res = offers[i].sell.res;
                let exprt_vol = offers[i].sell.vol;
                let imprt_res = offers[i].buy.res;
                let imprt_vol = offers[i].buy.vol;
                let exp_total = 0;
                let imp_total = 0;

                if (global.race['persuasive']){
                    imprt_vol *= 1 + (global.race['persuasive'] / 100);
                }
                if (global.race['merchant']){
                    imprt_vol *= 1 + (traits.merchant.vars()[1] / 100);
                }
                let fathom = fathomCheck('goblin');
                if (fathom > 0){
                    imprt_vol *= 1 + (traits.merchant.vars(1)[1] / 100 * fathom);
                }
                if (astroSign === 'capricorn'){
                    imprt_vol *= 1 + (astroVal('capricorn')[0] / 100);
                }
                if (global.race['devious']){
                    imprt_vol *= 1 - (traits.devious.vars()[0] / 100);
                }
                if (global.genes['trader']){
                    let mastery = calc_mastery();
                    imprt_vol *= 1 + (mastery / 100);
                }
                if (global.stats.achieve.hasOwnProperty('trade')){
                    let rank = global.stats.achieve.trade.l;
                    if (rank > 5){ rank = 5; }
                    imprt_vol *= 1 + (rank / 50);
                    exprt_vol *= 1 - (rank / 100);
                }

                used += global.galaxy.trade[`f${i}`];
                if (used > cap){
                    global.galaxy.trade[`f${i}`] -= used - cap;
                    if (global.galaxy.trade[`f${i}`] < 0){
                        global.galaxy.trade[`f${i}`] = 0;
                    }
                }

                let pirate = piracy('gxy_gorddon');
                for (let j=0; j<global.galaxy.trade[`f${i}`]; j++){
                    exp_total += exprt_vol;
                    if (modRes(exprt_res,-(exprt_vol * time_multiplier))){
                        modRes(imprt_res,imprt_vol * time_multiplier * pirate);
                        imp_total += imprt_vol;
                    }
                }

                if (exp_total > 0){
                    if (breakdown.p.consume[exprt_res][loc('trade')]){
                        breakdown.p.consume[exprt_res][loc('trade')] -= exp_total;
                    }
                    else {
                        breakdown.p.consume[exprt_res][loc('trade')] = -(exp_total);
                    }
                }

                if (imp_total > 0){
                    if (breakdown.p.consume[imprt_res][loc('trade')]){
                        breakdown.p.consume[imprt_res][loc('trade')] += imp_total;
                    }
                    else {
                        breakdown.p.consume[imprt_res][loc('trade')] = imp_total;
                    }
                }

                if (pirate < 1){
                    if (breakdown.p.consume[imprt_res][loc('galaxy_piracy')]){
                        breakdown.p.consume[imprt_res][loc('galaxy_piracy')] += -((1 - pirate) * imp_total);
                    }
                    else {
                        breakdown.p.consume[imprt_res][loc('galaxy_piracy')] = -((1 - pirate) * imp_total);
                    }
                }

                if (breakdown.p.consume[exprt_res][loc('trade')] === 0){
                    delete breakdown.p.consume[exprt_res][loc('trade')]
                }
                if (breakdown.p.consume[imprt_res][loc('trade')] === 0){
                    delete breakdown.p.consume[imprt_res][loc('trade')]
                }
            }
            global.galaxy.trade.cur = used;
        }

        if (global.race['deconstructor'] && global.city['nanite_factory']){
            nf_resources.forEach(function(r){
                if (global.resource[r].display){
                    let vol = global.city.nanite_factory[r] * time_multiplier;
                    if (vol > 0){
                        if (global.resource[r].amount < vol){
                            vol = global.resource[r].amount;
                        }
                        if (modRes(r,-(vol))){
                            breakdown.p.consume[r][loc('city_nanite_factory')] = -(vol / time_multiplier);
                            let trait = traits.deconstructor.vars()[0] / 100;
                            let nanite_vol = vol * atomic_mass[r] / 100 * trait;
                            breakdown.p.consume['Nanite'][global.resource[r].name] = nanite_vol / time_multiplier;
                            modRes('Nanite',nanite_vol);
                        }
                    }
                }
            });
        }

        let power_grid = 0;
        let max_power = 0;

        if (global.tauceti['ringworld'] && global.tauceti.ringworld.count >= 1000){
            let output = global.race['lone_survivor'] ? 100 : 10000;
            max_power -= output;
            power_grid += output;
            power_generated[loc('tau_star_ringworld')] = output;
        }

        if (global.interstellar['elysanite_sphere'] && global.interstellar.elysanite_sphere.count > 0){
            let output = 0;
            if (global.interstellar.elysanite_sphere.count >= 1000){
                output = powerModifier(22500);
            }
            else {
                output = powerModifier(1750 + (global.interstellar.elysanite_sphere.count * 18));
            }
            max_power -= output;
            power_grid += output;
            power_generated[loc('interstellar_dyson_sphere_title')] = output;
            delete power_generated[loc('tech_dyson_net')];
        }
        else if (global.interstellar['orichalcum_sphere'] && global.interstellar.orichalcum_sphere.count > 0){
            let output = 0;
            if (global.interstellar.orichalcum_sphere.count >= 100){
                output = powerModifier(1750);
            }
            else {
                output = powerModifier(750 + (global.interstellar.orichalcum_sphere.count * 8));
            }
            max_power -= output;
            power_grid += output;
            power_generated[loc('interstellar_dyson_sphere_title')] = output;
            delete power_generated[loc('tech_dyson_net')];
        }
        else if (global.interstellar['dyson_sphere'] && global.interstellar.dyson_sphere.count > 0){
            let output = 0;
            if (global.interstellar.dyson_sphere.count >= 100){
                output = powerModifier(750);
            }
            else {
                output = powerModifier(175 + (global.interstellar.dyson_sphere.count * 5));
            }
            max_power -= output;
            power_grid += output;
            power_generated[loc('interstellar_dyson_sphere_title')] = output;
            delete power_generated[loc('tech_dyson_net')];
        }
        else if (global.interstellar['dyson'] && global.interstellar.dyson.count >= 1){
            let output = 0;
            if (global.interstellar.dyson.count >= 100){
                output = powerModifier(175);
            }
            else {
                output = powerModifier(global.interstellar.dyson.count * 1.25);
            }
            max_power -= output;
            power_grid += output;
            power_generated[loc('tech_dyson_net')] = output;
        }

        if (global.interstellar['stellar_engine'] && global.interstellar.stellar_engine.count >= 100){
            let waves = global.tech['gravity'] && global.tech['gravity'] >= 2 ? 13.5 : 7.5;
            let r_mass = global.interstellar.stellar_engine.mass;
            if (global.tech['roid_eject']){
                r_mass += 0.225 * global.tech['roid_eject'] * (1 + (global.tech['roid_eject'] / 12));
            }
            let gWell = 1 + (global.stats.achieve['escape_velocity'] && global.stats.achieve.escape_velocity['h'] ? global.stats.achieve.escape_velocity['h'] * 0.02 : 0);
            let power = powerModifier(20 + ((r_mass - 8) * waves) + (global.interstellar.stellar_engine.exotic * waves * 10)) * gWell;
            if (power > 10000){
                power = 10000 + (power - 10000) ** 0.975;
                if (power > 20000){ power = 20000 + (power - 20000) ** 0.95; }
                if (power > 30000){ power = 30000 + (power - 30000) ** 0.925; }
            }
            max_power -= power;
            power_grid += power;
            power_generated[loc('tech_stellar_engine')] = power;
        }

        [
            {r:'city',s:'coal_power'},{r:'city',s:'oil_power'},{r:'city',s:'fission_power'},{r:'spc_hell',s:'geothermal'},{r:'spc_dwarf',s:'e_reactor'},
            {r:'int_alpha',s:'fusion'},{r:'tau_home',s:'fusion_generator'},{r:'tau_gas2',s:'alien_space_station'}
        ].forEach(function(generator){
            let space = convertSpaceSector(generator.r);
            let region = generator.r === 'city' ? generator.r : space;
            let c_action = generator.r === 'city' ? actions.city : actions[space][generator.r];
            let title = typeof c_action[generator.s].title === 'string' ? c_action[generator.s].title : c_action[generator.s].title();

            if (global[region][generator.s] && global[region][generator.s]['on']){
                let watts = c_action[generator.s].powered();
                p_on[generator.s] = global[region][generator.s].on;

                if (c_action[generator.s].hasOwnProperty('p_fuel')){
                    let s_fuels = c_action[generator.s].p_fuel();
                    if (!Array.isArray(s_fuels)){
                        s_fuels = [s_fuels];
                    }
                    for (let j=0; j<s_fuels.length; j++){
                        let fuel = s_fuels[j];
                        let fuel_cost = fuel.a;
                        if (['Oil','Helium_3'].includes(fuel.r) && region !== 'city'){
                            fuel_cost = region === 'space' ? +fuel_adjust(fuel_cost,true) : +int_fuel_adjust(fuel_cost);
                        }

                        let mb_consume = p_on[generator.s] * fuel_cost;
                        breakdown.p.consume[fuel.r][title] = -(mb_consume);
                        for (let k=0; k<p_on[generator.s]; k++){
                            if (!modRes(fuel.r, -(time_multiplier * fuel_cost))){
                                mb_consume -= (p_on[generator.s] * fuel_cost) - (k * fuel_cost);
                                p_on[generator.s] = k;
                                break;
                            }
                        }
                    }
                }

                let power = p_on[generator.s] * watts;
                max_power += power;
                power_grid -= power;
                power_generated[title] = -(power);

                if (p_on[generator.s] !== global[region][generator.s].on){
                    $(`#${region}-${generator.s} .on`).addClass('warn');
                    $(`#${region}-${generator.s} .on`).prop('title',`ON ${p_on[generator.s]}/${global[region][generator.s].on}`);
                }
                else {
                    $(`#${region}-${generator.s} .on`).removeClass('warn');
                    $(`#${region}-${generator.s} .on`).prop('title',`ON`);
                }
            }
            else {
                power_generated[title] = 0;
                p_on[generator.s] = 0;
                $(`#${region}-${generator.s} .on`).removeClass('warn');
                $(`#${region}-${generator.s} .on`).prop('title',`ON`);
            }
        });

        // Uranium
        if (!global.race['environmentalist'] && global.race.universe !== 'magic' && global.tech['uranium'] && global.tech['uranium'] >= 3 && p_on['coal_power']){
            let coal = p_on['coal_power'] * 0.35 * production('psychic_boost','Uranium');
            breakdown.p['Uranium'][loc('city_coal_ash')] = (coal / 65 / global_multiplier);
            modRes('Uranium', (coal * time_multiplier) / 65);
        }

        if (global.space['hydrogen_plant']){
            let output = actions.space.spc_titan.hydrogen_plant.powered();
            if (global.space.hydrogen_plant.on > global.space.electrolysis.on){
                global.space.hydrogen_plant.on = global.space.electrolysis.on;
            }
            let power = global.space.hydrogen_plant.on * output;
            max_power += power;
            power_grid -= power;
            power_generated[loc('space_hydrogen_plant_title')] = -(power);
        }

        if (global.portal['inferno_power']){
            let fuels = actions.portal.prtl_ruins.inferno_power.fuel;
            let operating = global.portal.inferno_power.on;

            Object.keys(fuels).forEach(function(fuel){
                let consume = operating * fuels[fuel];
                while (consume * time_multiplier > global.resource[fuel].amount + (global.resource[fuel].diff > 0 ? global.resource[fuel].diff * time_multiplier : 0) && consume > 0){
                    operating--;
                    consume -= fuels[fuel];
                }
                breakdown.p.consume[fuel][loc('portal_inferno_power_title')] = -(consume);
                modRes(fuel, -(consume * time_multiplier));
            });
            let power = operating * actions.portal.prtl_ruins.inferno_power.powered();

            max_power += power;
            power_grid -= power;
            power_generated[loc('portal_inferno_power_title')] = -(power);
        }

        if (global.eden['soul_engine'] && global.tech['asphodel'] && global.tech.asphodel >= 4){
            let power = (support_on['soul_engine'] || 0) * actions.eden.eden_asphodel.soul_engine.powered();
            max_power += power;
            power_grid -= power;
            power_generated[loc('eden_soul_engine_title')] = -(power);
        }

        if (global.space['swarm_satellite'] && global.space['swarm_control']){
            let active = global.space.swarm_satellite.count;
            if (active > global.space.swarm_control.s_max){
                active = global.space.swarm_control.s_max;
            }
            global.space.swarm_control.support = active;
            let solar = 0.35;
            if (global.tech.swarm >= 4){
                solar += 0.15 * (global.tech.swarm - 3);
            }
            if (global.stats.achieve['iron_will'] && global.stats.achieve.iron_will.l >= 1){ solar += 0.15; }
            if (global.blood['illuminate']){
                solar += 0.01 * global.blood.illuminate;
            }
            solar = +(solar).toFixed(2);
            let output = powerModifier(active * solar);
            max_power -= output;
            power_grid += output;
            power_generated[loc('space_sun_swarm_satellite_title')] = output;
        }

        if (global.race['wish'] && global.race['wishStats'] && global.race.wishStats.potato){
            let power = global.race.wishStats.potato;
            max_power -= power;
            power_grid += power;
            power_generated[loc('wish_potato')] = power;
        }

        if (global.city['mill'] && global.tech['agriculture'] && global.tech['agriculture'] >= 6){
            let power = powerModifier(global.city.mill.on * actions.city.mill.powered());
            max_power += power;
            power_grid -= power;
            power_generated[loc('city_mill_title2')] = -(power);
        }

        if (global.city['windmill'] && global.tech['wind_plant']){
            let power = powerModifier(global.city.windmill.count * actions.city.windmill.powered());
            max_power += power;
            power_grid -= power;
            power_generated[loc('city_mill_title2')] = -(power);
        }

        if (global.race['elemental'] && traits.elemental.vars()[0] === 'electric'){
            let power = powerModifier(highPopAdjust((global.resource[global.race.species].amount * traits.elemental.vars()[1]) ** 1.28));
            max_power -= power;
            power_grid += power;
            power_generated[loc('trait_elemental_name')] = power;
        }

        if (global.race['powered']){
            let citizens = traits.powered.vars()[0] * global.resource[global.race.species].amount;
            if (global.race['discharge'] && global.race['discharge'] > 0){
                citizens = +(citizens * 1.25).toFixed(3);
            }
            power_grid -= citizens;
        }

        if (global.race['replicator']){
            global.city['replicator'] = { count: global.race.replicator.pow, on: global.race.replicator.pow };
        }

        // Power usage
        let p_structs = global.power;

        // Determine total power demand across all structs and get a list of powered structs that support load balancing
        let totalPowerDemand = 0;
        let pb_list = [];
        for (let i=0; i<p_structs.length; i++){
            const parts = p_structs[i].split(":");
            const struct = parts[1];
            const region = parts[0] === 'city' ? parts[0] : convertSpaceSector(parts[0]);
            const c_action = parts[0] === 'city' ? actions.city[struct] : actions[region][parts[0]][struct];
            if (global[region][struct]?.on){
                if (region !== 'galaxy' || p_on['s_gate']){
                    totalPowerDemand += global[region][struct].on * c_action.powered();
                    p_on[struct] = global[region][struct].on;
                } else {
                    p_on[struct] = 0;
                }
            }
            if (global.settings.lowPowerBalance && c_action.hasOwnProperty('powerBalancer')){
                pb_list.push(p_structs[i]);
            }
        }

        // When short of power, proportionally reduce power demanded by supported structures (starting from lowest priority)
        if (global.settings.lowPowerBalance && totalPowerDemand > power_grid){
            let totalPowerUsage = totalPowerDemand;
            for (let i=pb_list.length-1; i >= 0; i--){
                const parts = pb_list[i].split(":");
                const struct = parts[1];
                let on = p_on[struct];

                if (totalPowerUsage > power_grid && on > 0){
                    const region = parts[0] === 'city' ? parts[0] : convertSpaceSector(parts[0]);
                    const c_action = parts[0] === 'city' ? actions.city[struct] : actions[region][parts[0]][struct];

                    let balValues = c_action.powerBalancer();
                    if (balValues){
                        balValues.forEach(function(v){
                            let off = 0;
                            if (v.hasOwnProperty('r') && v.hasOwnProperty('k')){
                                let val = global[region][struct][v.k] ?? 0;
                                if (global.resource[v.r]['odif'] && global.resource[v.r]['odif'] < 0) { global.resource[v.r]['odif'] = 0; }
                                let diff = global.resource[v.r].diff + (global.resource[v.r]['odif'] ? global.resource[v.r]['odif'] : 0);
                                while (diff - (off * val) > val && on > 0 && totalPowerUsage > power_grid){
                                    on--;
                                    off++;
                                    totalPowerUsage -= c_action.powered();
                                }
                                global.resource[v.r]['odif'] = val * off;
                            }
                            else if (v.hasOwnProperty('s')){
                                let sup = c_action.support();
                                if (global[region][struct]['soff'] && global[region][struct]['soff'] < 0) { global[region][struct]['soff'] = 0; }
                                let support = v.s + (global[region][struct]['soff'] ? global[region][struct]['soff'] : 0);
                                while (support - (sup * off) >= sup && on > 0 && totalPowerUsage > power_grid){
                                    on--;
                                    off++;
                                    totalPowerUsage -= c_action.powered();
                                }
                                global[region][struct]['soff'] = sup * off;
                            }
                        });
                        p_on[struct] = on;
                    }
                }
            }
        }

        // Power structures in priority order
        let power_grid_temp = power_grid;
        for (let i=0; i<p_structs.length; i++){
            const parts = p_structs[i].split(":");
            const struct = parts[1];
            const region = parts[0] === 'city' ? parts[0] : convertSpaceSector(parts[0]);
            const c_action = parts[0] === 'city' ? actions.city[struct] : actions[region][parts[0]][struct];
            if (global[region][struct]?.on){
                let power = p_on[struct] * c_action.powered();
                // Use a loop specifically because of citadel stations, which have variable power cost. Other buildings would accept a closed form.
                while (power > power_grid_temp && power > 0){
                    p_on[struct]--;
                    power = p_on[struct] * c_action.powered();
                }

                if (c_action.hasOwnProperty('p_fuel')){
                    let s_fuels = c_action.p_fuel();
                    if (!Array.isArray(s_fuels)){
                        s_fuels = [s_fuels];
                    }
                    for (let j=0; j<s_fuels.length; j++){
                        const title = typeof c_action.title === 'string' ? c_action.title : c_action.title();
                        const fuel = s_fuels[j];
                        const fuel_cost = ['Oil','Helium_3'].includes(fuel.r) && region === 'space' ? fuel_adjust(fuel.a,true) : fuel.a;
                        let mb_consume = p_on[struct] * fuel_cost;
                        for (let k=0; k<p_on[struct]; k++){
                            if (!modRes(fuel.r, -(time_multiplier * fuel_cost))){
                                mb_consume = k * fuel_cost;
                                p_on[struct] = k;
                                power = p_on[struct] * c_action.powered();
                                break;
                            }
                        }
                        breakdown.p.consume[fuel.r][title] = -(mb_consume);
                    }
                }
                power_grid_temp -= power;

                if (p_on[struct] !== global[region][struct].on){
                    $(`#${region}-${struct} .on`).addClass('warn');
                    $(`#${region}-${struct} .on`).prop('title',`ON ${p_on[struct]}/${global[region][struct].on}`);
                }
                else {
                    $(`#${region}-${struct} .on`).removeClass('warn');
                    $(`#${region}-${struct} .on`).prop('title',`ON`);
                }
            }
            else {
                p_on[struct] = 0;
                $(`#${region}-${struct} .on`).removeClass('warn');
                $(`#${region}-${struct} .on`).prop('title',`ON`);
            }
        }
        power_grid -= totalPowerDemand;

        // Mass Relay charging
        if (global.space['m_relay']){
            if (p_on['m_relay']){
                if (global.space.m_relay.charged < 10000){
                    global.space.m_relay.charged++;
                }
            }
            else {
                global.space.m_relay.charged = 0;
            }
        }

        // Troop Lander
        if (global.space['fob'] && global.space['lander']){
            if (p_on['fob']){
                let fuel = fuel_adjust(50,true);
                support_on['lander'] = global.space.lander.on;

                let total = garrisonSize(false,{nofob: true});
                let troopReq = jobScale(3);
                let deployed = support_on['lander'] * troopReq;
                if (deployed <= total){
                    global.space.fob.troops = deployed;
                }
                else {
                    support_on['lander'] -= Math.ceil((deployed - total) / troopReq);
                    global.space.fob.troops = support_on['lander'] * troopReq;
                }

                let mb_consume = support_on['lander'] * fuel;
                breakdown.p.consume.Oil[loc('space_lander_title')] = -(mb_consume);
                for (let i=0; i<support_on['lander']; i++){
                    if (!modRes('Oil', -(time_multiplier * fuel))){
                        mb_consume -= (support_on['lander'] * fuel) - (i * fuel);
                        support_on['lander'] -= i;
                        break;
                    }
                }

                if (support_on['lander'] !== global.space.lander.on){
                    $(`#space-lander .on`).addClass('warn');
                    $(`#space-lander .on`).prop('title',`ON ${support_on['lander']}/${global.space.lander.on}`);
                }
                else {
                    $(`#space-lander .on`).removeClass('warn');
                    $(`#space-lander .on`).prop('title',`ON`);
                }
            }
            else {
                global.space.fob.troops = 0;
                $(`#space-lander .on`).addClass('warn');
                $(`#space-lander .on`).prop('title',`ON 0/${global.space.lander.on}`);
            }
        }

        if (p_on['s_gate'] && p_on['foothold']){
            let increment = 2.5;
            let consume = (p_on['foothold'] * increment);
            while (consume * time_multiplier > global.resource['Elerium'].amount && consume > 0){
                consume -= increment;
                p_on['foothold']--;
            }
            breakdown.p.consume.Elerium[loc('galaxy_foothold')] = -(consume);
            let number = consume * time_multiplier;
            modRes('Elerium', -(number));
        }

        if(global.race['fasting']){
            const foodBuildings = ["city:tourist_center", "space:spaceport", "int_:starport", "gxy_:starbase"/*, "space:space_station", "space:embassy"*/, "space:space_barracks", "int_:zoo", "eden_:restaurant"];
            //titan quarters is excluded but not necessary because the scenario is incompatible with true path.
            //some buildings are excluded to make progression not impossible.
            for(let i=0;i<foodBuildings.length;i++){
                let parts = foodBuildings[i].split(":");
                let space = convertSpaceSector(parts[0]);
                let region = parts[0] === 'city' ? parts[0] : space;
                if (global[region][parts[1]] && global[region][parts[1]]['on']){
                    if(p_on[parts[1]]){
                        p_on[parts[1]] = 0;
                    }
                    $(`#${region}-${parts[1]} .on`).addClass('warn');
                    $(`#${region}-${parts[1]} .on`).prop('title',`ON 0`);
                }else {
                    $(`#${region}-${parts[1]} .on`).removeClass('warn');
                    $(`#${region}-${parts[1]} .on`).prop('title',`ON`);
                }
            }
            global.civic.meditator.display = true;
        }

        // Moon Bases, Spaceports, Etc
        [
            { a: 'space', r: 'spc_moon', s: 'moon_base', g: 'moon' },
            { a: 'space', r: 'spc_red', s: 'spaceport', g: 'red' },
            { a: 'space', r: 'spc_titan', s: 'electrolysis', g: 'titan' },
            { a: 'space', r: 'spc_titan', r2: 'spc_enceladus', s: 'titan_spaceport', g: 'enceladus' },
            { a: 'space', r: 'spc_eris', s: 'drone_control', g: 'eris' },
            { a: 'tauceti', r: 'tau_home', s: 'orbital_station', g: 'tau_home' },
            { a: 'tauceti', r: 'tau_red', s: 'orbital_platform', g: 'tau_red' },
            { a: 'tauceti', r: 'tau_roid', s: 'patrol_ship', g: 'tau_roid', oc: true },
            { a: 'eden', r: 'eden_asphodel', s: 'encampment', g: 'asphodel' },
        ].forEach(function(sup){
            sup['r2'] = sup['r2'] || sup.r;
            if (global[sup.a][sup.s] && global[sup.a][sup.s].count > 0){
                if (!p_structs.includes(`${sup.r}:${sup.s}`)){
                    p_on[sup.s] = global[sup.a][sup.s].on;
                }

                if (actions[sup.a][sup.r][sup.s].hasOwnProperty('support_fuel')){
                    let s_fuels = actions[sup.a][sup.r][sup.s].support_fuel();
                    if (!Array.isArray(s_fuels)){
                        s_fuels = [s_fuels];
                    }
                    for (let j=0; j<s_fuels.length; j++){
                        let fuel = s_fuels[j];
                        let fuel_cost = ['Oil','Helium_3'].includes(fuel.r) ? (sup.a === 'space' ? +fuel_adjust(fuel.a,true) : +int_fuel_adjust(fuel.a)) : fuel.a;
                        let mb_consume = p_on[sup.s] * fuel_cost;
                        breakdown.p.consume[fuel.r][actions[sup.a][sup.r][sup.s].title] = -(mb_consume);
                        for (let i=0; i<p_on[sup.s]; i++){
                            if (!modRes(fuel.r, -(time_multiplier * fuel_cost))){
                                mb_consume -= (p_on[sup.s] * fuel_cost) - (i * fuel_cost);
                                p_on[sup.s] = i;
                                break;
                            }
                        }
                        if (p_on[sup.s] < global[sup.a][sup.s].on){
                            $(`#space-${sup.s} .on`).addClass('warn');
                            $(`#space-${sup.s} .on`).prop('title',`ON ${p_on[sup.s]}/${global[sup.a][sup.s].on}`);
                        }
                        else {
                            $(`#space-${sup.s} .on`).removeClass('warn');
                            $(`#space-${sup.s} .on`).prop('title',`ON`);
                        }
                    }
                }

                global[sup.a][sup.s].s_max = p_on[sup.s] * actions[sup.a][sup.r][sup.s].support();
                switch (sup.g){
                    case 'moon':
                        {
                            global[sup.a][sup.s].s_max += global.tech['luna'] && global.tech['luna'] >= 2 ? p_on['nav_beacon'] * actions.space.spc_home.nav_beacon.support() : 0;
                        }
                        break;
                    case 'red':
                        {
                            global[sup.a][sup.s].s_max += global.tech['mars'] && global.tech['mars'] >= 3 ? p_on['red_tower'] * actions.space.spc_red.red_tower.support() : 0;
                            global[sup.a][sup.s].s_max += global.tech['luna'] && global.tech['luna'] >= 3 ? p_on['nav_beacon'] * actions.space.spc_home.nav_beacon.support() : 0;
                        }
                        break;
                    case 'tau_home':
                        {
                            global[sup.a][sup.s].s_max += p_on['tau_farm'] ? p_on['tau_farm'] : 0;
                        }
                        break;
                    case 'asphodel':
                        {
                            global[sup.a][sup.s].s_max += (p_on['rectory'] ? p_on['rectory'] : 0) * actions.eden.eden_asphodel.rectory.support();
                        }
                        break;
                }
            }

            if (global[sup.a][sup.s] && sup.r === 'spc_eris' && !p_on['ai_core2']){
                global[sup.a][sup.s].s_max = 0;
            }

            if (global[sup.a][sup.s]){
                let used_support = 0;
                let area_structs = global.support[sup.g].map(x => x.split(':')[1]);
                for (var i = 0; i < area_structs.length; i++){
                    if (global[sup.a][area_structs[i]]){
                        let id = actions[sup.a][sup.r2][area_structs[i]].id;
                        let supportSize = actions[sup.a][sup.r2][area_structs[i]].hasOwnProperty('support') ? actions[sup.a][sup.r2][area_structs[i]].support() * -1 : 1;
                        let operating = global[sup.a][area_structs[i]].on;
                        let remaining_support = global[sup.a][sup.s].s_max - used_support;

                        if ((operating * supportSize > remaining_support) && !sup.oc){
                            operating = Math.floor(remaining_support / supportSize);
                            $(`#${id} .on`).addClass('warn');
                            $(`#${id} .on`).prop('title',`ON ${operating}/${global[sup.a][area_structs[i]].on}`);
                        }
                        else {
                            $(`#${id} .on`).removeClass('warn');
                            $(`#${id} .on`).prop('title',`ON`);
                        }

                        if (actions[sup.a][sup.r2][area_structs[i]].hasOwnProperty('support_fuel')){
                            let s_fuels = actions[sup.a][sup.r2][area_structs[i]].support_fuel();
                            if (!Array.isArray(s_fuels)){
                                s_fuels = [s_fuels];
                            }
                            for (let j=0; j<s_fuels.length; j++){
                                let fuel = s_fuels[j];
                                let fuel_cost = ['Oil','Helium_3'].includes(fuel.r) ? (sup.a === 'space' ? +fuel_adjust(fuel.a,true) : +int_fuel_adjust(fuel.a)) : fuel.a;
                                let mb_consume = operating * fuel_cost;
                                breakdown.p.consume[fuel.r][actions[sup.a][sup.r2][area_structs[i]].title] = -(mb_consume);
                                for (let i=0; i<operating; i++){
                                    if (!modRes(fuel.r, -(time_multiplier * fuel_cost))){
                                        mb_consume -= (operating * fuel_cost) - (i * fuel_cost);
                                        operating -= i;
                                        break;
                                    }
                                }
                            }
                        }

                        used_support += operating * supportSize;
                        support_on[area_structs[i]] = operating;
                    }
                    else {
                        support_on[area_structs[i]] = 0;
                    }
                }
                global[sup.a][sup.s].support = used_support;
            }
        });

        let womling_technician = 1;
        if (global.tech['womling_technicians']){
            womling_technician = 1 + (p_on['womling_station'] * (global.tech['isolation'] ? 0.30 : 0.08));
            if (global.tech['womling_gene']){
                womling_technician *= 1.25;
            }
        }

        // Space Marines
        if (global.space['space_barracks'] && !global.race['fasting']){
            let oil_cost = +fuel_adjust(2,true);
            let sm_consume = global.space.space_barracks.on * oil_cost;
            breakdown.p.consume.Oil[loc('tech_space_marines_bd')] = -(sm_consume);
            for (let i=0; i<global.space.space_barracks.on; i++){
                if (!modRes('Oil', -(time_multiplier * oil_cost))){
                    sm_consume -= (global.space.space_barracks.on * oil_cost) - (i * oil_cost);
                    global.space.space_barracks.on -= i;
                    break;
                }
            }
        }

        if (p_on['red_factory'] && p_on['red_factory'] > 0){
            let h_consume = p_on['red_factory'] * fuel_adjust(1,true);
            modRes('Helium_3',-(h_consume * time_multiplier));
            breakdown.p.consume.Helium_3[structName('factory')] = -(h_consume);
        }

        if (p_on['int_factory'] && p_on['int_factory'] > 0){
            let d_consume = p_on['int_factory'] * int_fuel_adjust(5);
            modRes('Deuterium',-(d_consume * time_multiplier));
            breakdown.p.consume.Deuterium[loc('interstellar_int_factory_title')] = -(d_consume);
        }

        if (support_on['water_freighter'] && support_on['water_freighter'] > 0){
            let h_cost = fuel_adjust(5,true);
            let h_consume = support_on['water_freighter'] * h_cost;
            for (let i=0; i<support_on['water_freighter']; i++){
                if (!modRes('Helium_3', -(time_multiplier * h_cost))){
                    h_consume -= (support_on['water_freighter'] * h_cost) - (i * h_cost);
                    support_on['water_freighter'] -= i;
                    break;
                }
            }
            breakdown.p.consume.Helium_3[loc('space_water_freighter_title')] = -(h_consume);
        }

        // Starports
        if (global.interstellar['starport'] && global.interstellar['starport'].count > 0){
            let fuel_cost = +int_fuel_adjust(5);
            let mb_consume = p_on['starport'] * fuel_cost;
            breakdown.p.consume.Helium_3[loc('interstellar_alpha_starport_title')] = -(mb_consume);
            for (let i=0; i<p_on['starport']; i++){
                if (!modRes('Helium_3', -(time_multiplier * fuel_cost))){
                    mb_consume -= (p_on['starport'] * fuel_cost) - (i * fuel_cost);
                    p_on['starport'] -= i;
                    break;
                }
            }
            global.interstellar.starport.s_max = p_on['starport'] * actions.interstellar.int_alpha.starport.support();
            global.interstellar.starport.s_max += p_on['habitat'] * actions.interstellar.int_alpha.habitat.support();
            global.interstellar.starport.s_max += p_on['xfer_station'] * actions.interstellar.int_proxima.xfer_station.support();
        }

        // Droids
        let miner_droids = {
            adam: 0,
            uran: 0,
            coal: 0,
            alum: 0,
        };

        if (global.interstellar['starport']){
            let used_support = 0;
            let structs = global.support.alpha.map(x => x.split(':')[1]);
            for (var i = 0; i < structs.length; i++){
                if (global.interstellar[structs[i]]){
                    let operating = global.interstellar[structs[i]].on;
                    let id = actions.interstellar.int_alpha[structs[i]].id;
                    if (used_support + operating > global.interstellar.starport.s_max){
                        operating -=  (used_support + operating) - global.interstellar.starport.s_max;
                        $(`#${id} .on`).addClass('warn');
                        $(`#${id} .on`).prop('title',`ON ${operating}/${global.interstellar[structs[i]].on}`);
                    }
                    else {
                        $(`#${id} .on`).removeClass('warn');
                        $(`#${id} .on`).prop('title',`ON`);
                    }
                    used_support += operating;
                    int_on[structs[i]] = operating;
                }
                else {
                    int_on[structs[i]] = 0;
                }
            }
            global.interstellar.starport.support = used_support;

            if (global.interstellar.hasOwnProperty('mining_droid') && global.interstellar.mining_droid.count > 0){
                let on_droid = int_on['mining_droid'];
                let max_droid = global.interstellar.mining_droid.on;
                let eff = max_droid > 0 ? on_droid / max_droid : 0;
                let remaining = max_droid;

                ['adam','uran','coal','alum'].forEach(function(res){
                    remaining -= global.interstellar.mining_droid[res];
                    if (remaining < 0) {
                        global.interstellar.mining_droid[res] += remaining;
                        remaining = 0;
                    }
                    miner_droids[res] = global.interstellar.mining_droid[res] * eff;
                });
            }
        }

        // Starbase
        if (global.galaxy['starbase'] && global.galaxy['starbase'].count > 0){
            let fuel_cost = +int_fuel_adjust(25);
            let mb_consume = p_on['starbase'] * fuel_cost;
            breakdown.p.consume.Helium_3[loc('galaxy_starbase')] = -(mb_consume);
            for (let i=0; i<p_on['starbase']; i++){
                if (!modRes('Helium_3', -(time_multiplier * fuel_cost))){
                    mb_consume -= (p_on['starbase'] * fuel_cost) - (i * fuel_cost);
                    p_on['starbase'] -= i;
                    break;
                }
            }
            if (p_on['s_gate']){
                global.galaxy.starbase.s_max = p_on['starbase'] * actions.galaxy.gxy_gateway.starbase.support();
                if (p_on['gateway_station']){
                    global.galaxy.starbase.s_max += p_on['gateway_station'] * actions.galaxy.gxy_stargate.gateway_station.support();
                }
                if (p_on['telemetry_beacon']){
                    global.galaxy.starbase.s_max += p_on['telemetry_beacon'] * actions.galaxy.gxy_stargate.telemetry_beacon.support();
                }
                if (p_on['ship_dock']){
                    global.galaxy.starbase.s_max += p_on['ship_dock'] * actions.galaxy.gxy_gateway.ship_dock.support();
                }
            }
            else {
                global.galaxy.starbase.s_max = 0;
            }
        }

        if (global.galaxy['starbase']){
            let used_support = 0;
            let gateway_structs = global.support.gateway.map(x => x.split(':')[1]);
            for (var i = 0; i < gateway_structs.length; i++){
                if (global.galaxy[gateway_structs[i]]){
                    let operating = global.galaxy[gateway_structs[i]].on;
                    let id = actions.galaxy.gxy_gateway[gateway_structs[i]].id;
                    let operating_cost = -(actions.galaxy.gxy_gateway[gateway_structs[i]].support());
                    let max_operating = Math.floor((global.galaxy.starbase.s_max - used_support) / operating_cost);
                    if (operating > max_operating){
                        operating = max_operating;
                        $(`#${id} .on`).addClass('warn');
                        $(`#${id} .on`).prop('title',`ON ${operating}/${global.galaxy[gateway_structs[i]].on}`);
                    }
                    else {
                        $(`#${id} .on`).removeClass('warn');
                        $(`#${id} .on`).prop('title',`ON`);
                    }
                    used_support += operating * operating_cost;
                    gal_on[gateway_structs[i]] = operating;
                }
                else {
                    gal_on[gateway_structs[i]] = 0;
                }
            }
            global.galaxy.starbase.support = used_support;
        }

        // Foothold
        if (global.galaxy['foothold'] && global.galaxy.foothold.count > 0){
            global.galaxy.foothold.s_max = p_on['s_gate'] * p_on['foothold'] * actions.galaxy.gxy_alien2.foothold.support();
        }

        // Guard Post
        if (global.portal['guard_post']){
            global.portal.guard_post.s_max = global.portal.guard_post.count * actions.portal.prtl_ruins.guard_post.support();

            if (global.portal.guard_post.on > 0){
                let army = global.portal.fortress.garrison - (global.portal.fortress.patrols * global.portal.fortress.patrol_size);
                if (p_on['soul_forge']){
                    let forge = soulForgeSoldiers();
                    if (forge <= army){
                        army -= forge;
                    }
                }
                if (army < jobScale(global.portal.guard_post.on)){
                    global.portal.guard_post.on = Math.floor(army / jobScale(1));
                }
            }

            global.portal.guard_post.support = global.portal.guard_post.on;
        }

        // harbor
        if (global.portal['harbor']){
            global.portal.harbor.s_max = p_on['harbor'] * actions.portal.prtl_lake.harbor.support();
        }

        // Purifier
        if (global.portal['purifier']){
            global.portal.purifier.s_max = +(p_on['purifier'] * actions.portal.prtl_spire.purifier.support()).toFixed(2);

            let used_support = 0;
            let purifier_structs = global.support.spire.map(x => x.split(':')[1]);
            for (var i = 0; i < purifier_structs.length; i++){
                if (global.portal[purifier_structs[i]]){
                    let operating = global.portal[purifier_structs[i]].on;
                    let id = actions.portal.prtl_spire[purifier_structs[i]].id;
                    if (used_support + operating > global.portal.purifier.s_max){
                        operating -= (used_support + operating) - global.portal.purifier.s_max;
                        $(`#${id} .on`).addClass('warn');
                        $(`#${id} .on`).prop('title',`ON ${operating}/${global.portal[purifier_structs[i]].on}`);
                    }
                    else {
                        $(`#${id} .on`).removeClass('warn');
                        $(`#${id} .on`).prop('title',`ON`);
                    }
                    used_support += operating * -(actions.portal.prtl_spire[purifier_structs[i]].support());
                    spire_on[purifier_structs[i]] = operating;
                }
                else {
                    spire_on[purifier_structs[i]] = 0;
                }
            }
            global.portal.purifier.support = used_support;
        }

        // Space Station
        if (global.space['space_station'] && global.space['space_station'].count > 0){
            let fuel_cost = +fuel_adjust(2.5,true);
            let ss_consume = p_on['space_station'] * fuel_cost;
            breakdown.p.consume.Helium_3[loc('space_belt_station_title')] = -(ss_consume);
            for (let i=0; i<p_on['space_station']; i++){
                if (!modRes('Helium_3', -(time_multiplier * fuel_cost))){
                    ss_consume -= (p_on['space_station'] * fuel_cost) - (i * fuel_cost);
                    p_on['space_station'] -= i;
                    break;
                }
            }
        }

        if (global.space['space_station']){
            let used_support = 0;
            let belt_structs = global.support.belt.map(x => x.split(':')[1]);
            for (var i = 0; i < belt_structs.length; i++){
                if (global.space[belt_structs[i]]){
                    let operating = global.space[belt_structs[i]].on;
                    let id = actions.space.spc_belt[belt_structs[i]].id;
                    if (used_support + (operating * -(actions.space.spc_belt[belt_structs[i]].support())) > global.space.space_station.s_max){
                        let excess = used_support + (operating * -(actions.space.spc_belt[belt_structs[i]].support())) - global.space.space_station.s_max;
                        operating -= Math.ceil(excess / -(actions.space.spc_belt[belt_structs[i]].support()));
                        $(`#${id} .on`).addClass('warn');
                        $(`#${id} .on`).prop('title',`ON ${operating}/${global.space[belt_structs[i]].on}`);
                    }
                    else {
                        $(`#${id} .on`).removeClass('warn');
                        $(`#${id} .on`).prop('title',`ON`);
                    }
                    used_support += (operating * -(actions.space.spc_belt[belt_structs[i]].support()));
                    support_on[belt_structs[i]] = operating;
                }
                else {
                    support_on[belt_structs[i]] = 0;
                }
            }
            global.space.space_station.support = used_support;
        }

        if (global.interstellar['nexus'] && global.interstellar['nexus'].count > 0){
            let cash_cost = 350;
            let mb_consume = p_on['nexus'] * cash_cost;
            breakdown.p.consume.Money[loc('interstellar_nexus_bd')] = -(mb_consume);
            for (let i=0; i<p_on['nexus']; i++){
                if (!modRes('Money', -(time_multiplier * cash_cost))){
                    mb_consume -= (p_on['nexus'] * cash_cost) - (i * cash_cost);
                    p_on['nexus'] -= i;
                    break;
                }
            }
            global.interstellar.nexus.s_max = p_on['nexus'] * actions.interstellar.int_nebula.nexus.support();
        }

        if (global.interstellar['nexus']){
            let used_support = 0;
            let structs = global.support.nebula.map(x => x.split(':')[1]);
            for (var i = 0; i < structs.length; i++){
                if (global.interstellar[structs[i]]){
                    let operating = global.interstellar[structs[i]].on;
                    let id = actions.interstellar.int_nebula[structs[i]].id;
                    if (used_support + operating > global.interstellar.nexus.s_max){
                        operating -=  (used_support + operating) - global.interstellar.nexus.s_max;
                        $(`#${id} .on`).addClass('warn');
                        $(`#${id} .on`).prop('title',`ON ${operating}/${global.interstellar[structs[i]].on}`);
                    }
                    else {
                        $(`#${id} .on`).removeClass('warn');
                        $(`#${id} .on`).prop('title',`ON`);
                    }
                    used_support += operating;
                    int_on[structs[i]] = operating;
                }
                else {
                    int_on[structs[i]] = 0;
                }
            }
            global.interstellar.nexus.support = used_support;
        }

        // Transfer Station
        if (global.interstellar['xfer_station'] && p_on['xfer_station']){
            let fuel_cost = 0.28;
            let xfer_consume = p_on['xfer_station'] * fuel_cost;
            breakdown.p.consume.Uranium[loc('interstellar_xfer_station_title')] = -(xfer_consume);
            for (let i=0; i<p_on['xfer_station']; i++){
                if (!modRes('Uranium', -(time_multiplier * fuel_cost))){
                    xfer_consume -= (p_on['xfer_station'] * fuel_cost) - (i * fuel_cost);
                    p_on['xfer_station'] -= i;
                    break;
                }
            }
        }

        // Foward Operating Base
        if (global.space['fob'] && p_on['fob']){
            let fuel_cost = +fuel_adjust(125,true);
            let xfer_consume = p_on['fob'] * fuel_cost;
            breakdown.p.consume.Helium_3[loc('tech_fob')] = -(xfer_consume);
            for (let i=0; i<p_on['fob']; i++){
                if (!modRes('Helium_3', -(time_multiplier * fuel_cost))){
                    xfer_consume -= (p_on['fob'] * fuel_cost) - (i * fuel_cost);
                    p_on['fob'] -= i;
                    break;
                }
            }
        }

        // Outpost
        if (p_on['outpost'] && p_on['outpost'] > 0){
            let fuel_cost = +fuel_adjust(2,true);
            let out_consume = p_on['outpost'] * fuel_cost;
            breakdown.p.consume.Oil[loc('space_gas_moon_outpost_bd')] = -(out_consume);
            for (let i=0; i<p_on['outpost']; i++){
                if (!modRes('Oil', -(time_multiplier * fuel_cost))){
                    out_consume -= (p_on['outpost'] * fuel_cost) - (i * fuel_cost);
                    p_on['outpost'] -= i;
                    break;
                }
            }
        }

        // Neutron Miner
        if (p_on['neutron_miner'] && p_on['neutron_miner'] > 0){
            let fuel_cost = +int_fuel_adjust(3);
            let out_consume = p_on['neutron_miner'] * fuel_cost;
            breakdown.p.consume.Helium_3[loc('interstellar_neutron_miner_title')] = -(out_consume);
            for (let i=0; i<p_on['neutron_miner']; i++){
                if (!modRes('Helium_3', -(time_multiplier * fuel_cost))){
                    out_consume -= (p_on['neutron_miner'] * fuel_cost) - (i * fuel_cost);
                    p_on['neutron_miner'] -= i;
                    break;
                }
            }
        }

        // Patrol Cruiser
        if (global.interstellar['cruiser']){
            let fuel_cost = +int_fuel_adjust(6);
            let active = global.interstellar['cruiser'].on;
            let out_consume = active * fuel_cost;
            breakdown.p.consume.Helium_3[loc('interstellar_cruiser_title')] = -(out_consume);
            for (let i=0; i<global.interstellar['cruiser'].on; i++){
                if (!modRes('Helium_3', -(time_multiplier * fuel_cost))){
                    out_consume -= (global.interstellar['cruiser'].on * fuel_cost) - (i * fuel_cost);
                    active -= i;
                    break;
                }
            }
            int_on['cruiser'] = active;
        }

        // Pillbox
        if (global.eden['pillbox']){
            let pillsize = jobScale(10);
            if (p_on['pillbox']){
                var staff = p_on['pillbox'] * pillsize;
                let soldiers = garrisonSize(false,{nopill: true});
                if (soldiers < staff){
                    staff = Math.floor(soldiers / pillsize) * pillsize;
                }
                global.eden.pillbox.staffed = staff;
            }
            else {
                global.eden.pillbox.staffed = 0;
            }

            if (global.eden.pillbox.staffed < p_on['pillbox'] * pillsize){
                $(`#eden-pillbox .on`).addClass('warn');
            }
            else {
                $(`#eden-pillbox .on`).removeClass('warn')
            }
        }

        // Graphene Hack
        if (global.tech['isolation'] && global.race['truepath']){
            support_on['g_factory'] = p_on['refueling_station'];
            global.space.g_factory.count = global.tauceti.refueling_station.count;
            global.space.g_factory.on = global.tauceti.refueling_station.on;
        }

        if (global.race['replicator'] && p_on['replicator']){
            let res = global.race.replicator.res;
            if (!['Asphodel_Powder','Elysanite'].includes(res)){
                let vol = replicator(res,p_on['replicator']);
                breakdown.p.consume[res][loc('tau_replicator_db')] = vol;
                modRes(res, time_multiplier * vol);
            }
        }

        // Stargate
        if (p_on['s_gate']){
            if (!global.settings.showGalactic){
                global.settings.showGalactic = true;
                global.settings.space.stargate = true;
                renderSpace();
            }
        }
        else {
            global.settings.showGalactic = false;
            global.settings.space.stargate = false;
        }

        // Ship Yard
        if (p_on['shipyard']){
            global.settings.showShipYard = true;
        }
        else {
            global.settings.showShipYard = false;
            if (global.settings.govTabs === 5){
                global.settings.govTabs = 0;
            }
        }

        var galaxy_ship_types = [
            {
                area: 'galaxy',
                region: 'gxy_gateway',
                ships: global.support.gateway.map(x => x.split(':')[1])
            },
            {
                area: 'galaxy',
                region: 'gxy_gorddon',
                ships: ['freighter'],
                req: 'embassy'
            },
            {
                area: 'galaxy',
                region: 'gxy_alien1',
                ships: ['super_freighter'],
                req: 'embassy'
            },
            {
                area: 'galaxy',
                region: 'gxy_alien2',
                ships: global.support.alien2.map(x => x.split(':')[1]),
                req: 'foothold'
            },
            {
                area: 'galaxy',
                region: 'gxy_chthonian',
                ships: ['minelayer','raider'],
                req: 'starbase'
            },
            {
                area: 'portal',
                region: 'prtl_lake',
                ships: global.support.lake.map(x => x.split(':')[1]),
                req: 'harbor'
            }
        ];

        let crew_civ = 0;
        let crew_mil = 0;
        let total = 0;
        let andromeda_helium = 0;
        let andromeda_deuterium = 0;

        for (let j=0; j<galaxy_ship_types.length; j++){
            const area = galaxy_ship_types[j].area;
            const region = galaxy_ship_types[j].region;
            const req = galaxy_ship_types[j].hasOwnProperty('req') ? p_on[galaxy_ship_types[j].req] > 0 : true;
            const support_home = actions[area][region].info?.support;
            let used_support = 0;
            for (let i=0; i<galaxy_ship_types[j].ships.length; i++){
                const ship = galaxy_ship_types[j].ships[i];
                if (global[area][ship]){
                    let operating = 0;
                    if (global[area][ship].hasOwnProperty('on') && req && (p_on['s_gate'] || area !== 'galaxy')){
                        const id = actions[area][region][ship].id;
                        const num_on = global[area][ship].on;
                        operating = num_on;

                        // Support cost
                        const operating_cost = actions[area][region][ship].hasOwnProperty('support') ? -(actions[area][region][ship].support()) : 0;
                        if (operating_cost > 0){
                            const max_operating = Math.floor((global[area][support_home].s_max - used_support) / operating_cost);
                            operating = Math.min(operating, max_operating);
                        }

                        if (actions[area][region][ship].hasOwnProperty('ship')){
                            if (actions[area][region][ship].ship.civ && global[area][ship].hasOwnProperty('crew')){
                                // Civilian ships can only be crewed at a rate of 1 ship (per type) per fast tick
                                let civPerShip = actions[area][region][ship].ship.civ();
                                if (civPerShip > 0){
                                    if (global[area][ship].crew < 0){
                                        global[area][ship].crew = 0;
                                    }
                                    if (global[area][ship].crew < operating * civPerShip){
                                        if (total < global.resource[global.race.species].amount){
                                            if (global.civic[global.civic.d_job].workers >= civPerShip){
                                                global.civic[global.civic.d_job].workers -= civPerShip;
                                                global.civic.crew.workers += civPerShip;
                                                global[area][ship].crew += civPerShip;
                                            }
                                        }
                                    }
                                    else if (global[area][ship].crew > operating * civPerShip){
                                        global.civic[global.civic.d_job].workers += civPerShip;
                                        global.civic.crew.workers -= civPerShip;
                                        global[area][ship].crew -= civPerShip;
                                    }
                                    global.civic.crew.assigned = global.civic.crew.workers;
                                    crew_civ += global[area][ship].crew;
                                    total += global[area][ship].crew;
                                    operating = Math.min(operating, Math.floor(global[area][ship].crew / civPerShip));
                                }
                            }

                            if (actions[area][region][ship].ship.mil && global[area][ship].hasOwnProperty('mil')){
                                // All military ships can be crewed instantly
                                let milPerShip = actions[area][region][ship].ship.mil();
                                if (milPerShip > 0){
                                    if (global[area][ship].mil !== operating * milPerShip){
                                        global[area][ship].mil = operating * milPerShip;
                                    }
                                    if (global.civic.garrison.workers - global.portal.fortress.garrison < 0){
                                        let underflow = global.civic.garrison.workers - global.portal.fortress.garrison;
                                        global[area][ship].mil -= underflow;
                                    }
                                    if (crew_mil + global[area][ship].mil > global.civic.garrison.workers - global.portal.fortress.garrison){
                                        global[area][ship].mil = global.civic.garrison.workers - global.portal.fortress.garrison - crew_mil;
                                    }
                                    if (global[area][ship].mil < 0){
                                        global[area][ship].mil = 0;
                                    }
                                    crew_mil += global[area][ship].mil;
                                    operating = Math.min(operating, Math.floor(global[area][ship].mil / milPerShip));
                                }
                            }

                            if (actions[area][region][ship].ship.hasOwnProperty('helium')){
                                let increment = +int_fuel_adjust(actions[area][region][ship].ship.helium).toFixed(2);
                                let consume = operating * increment;
                                while (consume * time_multiplier > global.resource.Helium_3.amount + (global.resource.Helium_3.diff > 0 ? global.resource.Helium_3.diff * time_multiplier : 0) && operating > 0){
                                    consume -= increment;
                                    operating--;
                                }
                                modRes('Helium_3', -(consume * time_multiplier));
                                andromeda_helium += consume;
                            }

                            if (actions[area][region][ship].ship.hasOwnProperty('deuterium')){
                                let increment = +int_fuel_adjust(actions[area][region][ship].ship.deuterium).toFixed(2);
                                let consume = operating * increment;
                                while (consume * time_multiplier > global.resource.Deuterium.amount + (global.resource.Deuterium.diff > 0 ? global.resource.Deuterium.diff * time_multiplier : 0) && operating > 0){
                                    consume -= increment;
                                    operating--;
                                }
                                modRes('Deuterium', -(consume * time_multiplier));
                                andromeda_deuterium += consume;
                            }
                        }

                        if (operating < num_on){
                            $(`#${id} .on`).addClass('warn');
                            $(`#${id} .on`).prop('title',`ON ${operating}/${num_on}`);
                        }
                        else {
                            $(`#${id} .on`).removeClass('warn');
                            $(`#${id} .on`).prop('title',`ON`);
                        }

                        used_support += operating * operating_cost;
                    }
                    gal_on[ship] = operating;
                }
            }
            if (support_home && global?.[area]?.[support_home]?.hasOwnProperty('support')){
                global[area][support_home].support = used_support;
            }
        }

        breakdown.p.consume.Helium_3[loc('galaxy_fuel_consume')] = -(andromeda_helium);
        breakdown.p.consume.Deuterium[loc('galaxy_fuel_consume')] = -(andromeda_deuterium);

        global.civic.crew.workers = crew_civ;
        if (global.civic.garrison.hasOwnProperty('crew')){
            if (global.space.hasOwnProperty('shipyard') && global.space.shipyard.hasOwnProperty('ships')){
                global.space.shipyard.ships.forEach(function(ship){
                    if (ship.location !== 'spc_dwarf' || (ship.location === 'spc_dwarf' && ship.transit > 0)){
                        crew_mil += shipCrewSize(ship);
                    }
                });
            }
            global.civic.garrison.crew = crew_mil;
        }

        // Detect labor anomalies
        Object.keys(job_desc).forEach(function (job) {
            if (global.civic[job]){
                if (job !== 'crew'){
                    total += global.civic[job].workers;
                    if (total > global.resource[global.race.species].amount){
                        global.civic[job].workers -= total - global.resource[global.race.species].amount;
                    }
                    if (!global.civic[job].display || global.civic[job].workers < 0){
                        global.civic[job].workers = 0;
                    }
                }
                if (job !== 'unemployed' && job !== 'hunter' && job !== 'forager'){
                    let stress_level = global.civic[job].stress;
                    if (global.city.ptrait.includes('mellow')){
                        stress_level += planetTraits.mellow.vars()[1];
                    }
                    if (global.race['content']){
                        let effectiveness = job === 'hell_surveyor' ? 0.2 : 0.4;
                        stress_level += global.race['content'] * effectiveness;
                    }
                    if (global.city.ptrait.includes('dense') && job === 'miner'){
                        stress_level -= planetTraits.dense.vars()[1];
                    }
                    if (global.race['freespirit'] && job !== 'farmer' && job !== 'lumberjack' && job !== 'quarry_worker' && job !== 'crystal_miner' && job !== 'scavenger'){
                        stress_level /= 1 + (traits.freespirit.vars()[0] / 100);
                    }

                    let workers = global.civic[job].workers;
                    if (global.race['high_pop']){
                        workers /= traits.high_pop.vars()[0];
                    }

                    if (global.race['sky_lover'] && ['miner','coal_miner','crystal_miner','pit_miner'].includes(job)){
                        workers *= 1 + (traits.sky_lover.vars()[0] / 100);
                    }

                    stress -= workers / stress_level;
                }
            }
        });
        global.civic[global.civic.d_job].workers += global.resource[global.race.species].amount - total;
        if (global.civic[global.civic.d_job].workers < 0){
            global.civic[global.civic.d_job].workers = 0;
        }

        Object.keys(job_desc).forEach(function (job){
            if (job !== 'craftsman' && global.civic[job] && global.civic[job].display && global.civic[job].workers < global.civic[job].assigned && global.civic[global.civic.d_job].workers > 0 && global.civic[job].workers < global.civic[job].max){
                global.civic[job].workers++;
                global.civic[global.civic.d_job].workers--;
            }
        });

        let entertainment = 0;
        if (global.tech['theatre']){
            entertainment += workerScale(global.civic.entertainer.workers,'entertainer') * global.tech.theatre;
            if (global.race['musical']){
                entertainment += workerScale(global.civic.entertainer.workers,'entertainer') * traits.musical.vars()[0];
            }
            if (astroSign === 'sagittarius'){
                entertainment *= 1 + (astroVal('sagittarius')[0] / 100);
            }
            if (global.race['emotionless']){
                entertainment *= 1 - (traits.emotionless.vars()[0] / 100);
            }
            if (global.race['high_pop']){
                entertainment *= traits.high_pop.vars()[1] / 100;
            }
        }
        if (global.civic.govern.type === 'democracy'){
            let democracy = 1 + (govEffect.democracy()[0] / 100);
            entertainment *= democracy;
        }
        global.city.morale.entertain = entertainment;
        morale += entertainment;

        if (global.tech['broadcast']){
            let gasVal = govActive('gaslighter',0);
            let signalVal = global.race['orbit_decayed'] ? (p_on['nav_beacon'] || 0) : (global.tech['isolation'] && global.race['truepath'] ? support_on['colony'] : p_on['wardenclyffe']);
            if (global.race['orbit_decayed']){ signalVal /= 2; }
            let mVal = gasVal ? gasVal + global.tech.broadcast : global.tech.broadcast;
            if (global.tech['isolation']){ mVal *= 2; }
            global.city.morale.broadcast = signalVal * mVal;
            morale += signalVal * mVal;
        }
        if (support_on['vr_center']){
            let gasVal = govActive('gaslighter',1);
            let vr_morale = gasVal ? gasVal + 1 : 1;
            if (global.race['orbit_decayed']){
                vr_morale += 2;
            }
            global.city.morale.vr = support_on['vr_center'] * vr_morale;
            morale += support_on['vr_center'] * vr_morale;
        }
        else {
            global.city.morale.vr = 0;
        }
        if (int_on['zoo'] && !global.race['fasting']){
            global.city.morale.zoo = int_on['zoo'] * 5;
            morale += int_on['zoo'] * 5;
        }
        else {
            global.city.morale.zoo = 0;
        }
        if (support_on['bliss_den']){
            global.city.morale.bliss_den = support_on['bliss_den'] * 8;
            morale += support_on['bliss_den'] * 8;
        }
        else {
            global.city.morale.bliss_den = 0;
        }
        if (p_on['restaurant'] && !global.race['fasting']){
            let val = 0;
            val += global.eden.hasOwnProperty('pillbox') && p_on['pillbox'] ? 0.35 * p_on['pillbox'] : 0;
            val += global.civic.elysium_miner.workers * 0.15;
            val += global.eden.hasOwnProperty('archive') && p_on['archive'] ? 0.4 * p_on['archive'] : 0;
            global.city.morale.restaurant = p_on['restaurant'] * val;
            morale += p_on['restaurant'] * val;
        }
        else {
            global.city.morale.restaurant = 0;
        }
        if (eventActive('summer')){
            let boost = (global.resource.Thermite.diff * 2.5) / (global.resource.Thermite.diff * 2.5 + 500) * 500;
            global.city.morale['bonfire'] = boost;
            morale += boost;
        }
        else {
            delete global.city.morale['bonfire'];
        }

        if (global.civic.govern.type === 'anarchy'){
            stress /= 2;
        }
        if (global.civic.govern.type === 'autocracy'){
            stress *= 1 + (govEffect.autocracy()[0] / 100);
        }
        if (global.civic.govern.type === 'socialist'){
            stress *= 1 + (govEffect.socialist()[2] / 100);
        }
        if (global.race['emotionless']){
            stress *= 1 - (traits.emotionless.vars()[1] / 100);
        }
        for (let i=0; i<3; i++){
            if (global.civic.govern.type !== 'federation' && global.civic.foreign[`gov${i}`].anx){
                stress *= 1.1;
            }
        }

        if (global.civic.govern.type === 'dictator'){
            stress *= 1 + (govEffect.dictator()[0] / 100);
        }

        stress = +(stress).toFixed(1);
        global.city.morale.stress = stress;
        morale += stress;

        global.city.morale.tax = 20 - global.civic.taxes.tax_rate;
        morale -= global.civic.taxes.tax_rate - 20;
        if (global.civic.taxes.tax_rate > 40){
            let high_tax = global.civic.taxes.tax_rate - 40;
            global.city.morale.tax -= high_tax * 0.5;
            morale -= high_tax * 0.5;
        }
        if (global.civic.govern.type === 'oligarchy' && global.civic.taxes.tax_rate > 20){
            let high_tax = global.civic.taxes.tax_rate - 20;
            global.city.morale.tax += high_tax * 0.5;
            morale += high_tax * 0.5;
        }

        if (((global.civic.govern.type !== 'autocracy' && !global.race['blood_thirst']) || global.race['immoral']) && global.civic.garrison.protest + global.civic.garrison.fatigue > 2){
            let immoral = global.race['immoral'] ? 1 + (traits.immoral.vars()[0] / 100) : 1;
            let warmonger = Math.round(Math.log2(global.civic.garrison.protest + global.civic.garrison.fatigue) * immoral);
            global.city.morale.warmonger = global.race['immoral'] ? warmonger : -(warmonger);
            morale += global.city.morale.warmonger;
        }
        else {
            global.city.morale.warmonger = 0;
        }

        let mBaseCap = 100;
        mBaseCap += global.city['casino'] ? p_on['casino'] : 0;
        mBaseCap += global.space['spc_casino'] ? p_on['spc_casino'] : 0;
        mBaseCap += global.tauceti['tauceti_casino'] ? p_on['tauceti_casino'] : 0;

        if (global.city['amphitheatre']){
            let athVal = govActive('athleticism',0);
            mBaseCap += athVal ? (global.city.amphitheatre.count * athVal) : global.city.amphitheatre.count;
        }
        if (support_on['vr_center']){
            mBaseCap += support_on['vr_center'] * 2;
        }
        if (int_on['zoo'] && !global.race['fasting']){
            mBaseCap += int_on['zoo'] * 2;
        }
        if (support_on['bliss_den']){
            mBaseCap += support_on['bliss_den'] * 2;
        }
        if (p_on['resort']){
            mBaseCap += p_on['resort'] * 2;
        }
        if (global.eden['rushmore'] && global.eden.rushmore.count === 1){
            mBaseCap += 10;
        }
        if (global.tech['superstar']){
            let mcapval = global.race['high_pop'] ? highPopAdjust(1) : 1;
            mBaseCap += workerScale(global.civic.entertainer.workers,'entertainer') * mcapval;
        }
        moraleCap = mBaseCap;

        if (global.tech['monuments']){
            let gasVal = govActive('gaslighter',2);
            let mcap = gasVal ? (2 - gasVal) : 2;
            let monuments = global.tech.monuments;
            if (global.race['wish'] && global.race['wishStats']){
                if (global.city['wonder_lighthouse']){ monuments += 5; }
                if (global.city['wonder_pyramid']){ monuments += 5; }
                if (global.space['wonder_statue']){ monuments += 5; }
                if (global.interstellar['wonder_gardens'] || global.space['wonder_gardens']){ monuments += 5; }
            }
            moraleCap += monuments * mcap;
        }

        if (global.civic.taxes.tax_rate < 20 && !global.race['banana']){
            moraleCap += 10 - Math.floor(global.civic.taxes.tax_rate / 2);
        }

        if (global.stats.achieve['joyless']){
            moraleCap += global.stats.achieve['joyless'].l * 2;
        }

        if (global.race['motivated']){
            let boost = Math.ceil(global.race['motivated'] ** 0.4);
            moraleCap += Math.round(boost / 2);
        }

        let m_min = 50;
        if (global.race['optimistic']){
            m_min += traits.optimistic.vars()[1];
        }
        if (geckoFathom > 0){
            m_min += Math.round(traits.optimistic.vars(1)[1] * geckoFathom);
        }
        if (global.race['truepath']){
            m_min -= 25;
        }
        if (global.civic.govern.fr > 0){
            let rev = morale / 2;
            global.city.morale.rev = rev;
            morale -= rev;
            m_min -= 10;
        }
        else {
            global.city.morale.rev = 0;
        }

        if (global.race['tormented']){
            if (morale > 100){
                let excess = morale - 100;
                excess = Math.ceil(excess * traits.tormented.vars()[0] / 100);
                morale -= excess;
                global.city['tormented'] = excess;
            }
            else {
                global.city['tormented'] = 0;
            }
        }
        else {
            delete global.city['tormented'];
        }

        if (global.race['wish'] && global.race['wishStats'] && global.race.wishStats.bad > 0){
            let badPress = Math.floor(global.race.wishStats.bad / 75) + 1;
            morale -= badPress * 5;
        }

        global.city.morale.potential = +(morale).toFixed(1);
        if (morale < m_min){
            morale = m_min;
        }
        else if (morale > moraleCap){
            morale = moraleCap;
        }
        global.city.morale.cap = moraleCap;
        global.city.morale.current = morale;

        if (global.city.morale.current < 100){
            if (global.race['blissful']){
                let mVal = global.city.morale.current - 100;
                let bliss = traits.blissful.vars()[0] / 100;
                global_multiplier *= 1 + (mVal * bliss / 100);
                breakdown.p['Global'][loc('morale')] = (mVal * bliss) + '%';
            }
            else {
                global_multiplier *= global.city.morale.current / 100;
                breakdown.p['Global'][loc('morale')] = (global.city.morale.current - 100) + '%';
            }
        }
        else {
            global_multiplier *= 1 + ((global.city.morale.current - 100) / 200);
            breakdown.p['Global'][loc('morale')] = ((global.city.morale.current - 100) / 2) + '%';
        }

        if (global.race['lazy'] && global.city.calendar.temp === 2){
            breakdown.p['Global'][loc('trait_lazy_bd')] = '-' + traits.lazy.vars()[0] + '%';
            global_multiplier *= 1 - (traits.lazy.vars()[0] / 100);
        }
        if (global.race['distracted']){
            breakdown.p['Global'][loc('event_m_curious3_bd')] = '-5%';
            global_multiplier *= 0.95;
        }
        if (global.race['stimulated']){
            breakdown.p['Global'][loc('event_m_curious4_bd')] = '+10%';
            global_multiplier *= 1.1;
        }

        if (global.civic.govern.type === 'dictator'){
            breakdown.p['Global'][loc('wish_dictator')] = `+${govEffect.dictator()[1]}%`;
            global_multiplier *= 1 + (govEffect.dictator()[1] / 100);
        }

        if (global.race['selenophobia']){
            let moon = global.city.calendar.moon > 14 ? 28 - global.city.calendar.moon : global.city.calendar.moon;
            breakdown.p['Global'][loc('moon_phase')] = (-(moon) + traits.selenophobia.vars()[0]) + '%';
            moon = 1 + (traits.selenophobia.vars()[0] / 100) - (moon / 100);
            global_multiplier *= moon;
        }

        if (global.interstellar['mass_ejector']){
            let total = 0;
            let mass = 0;
            let exotic = 0;
            Object.keys(global.interstellar.mass_ejector).forEach(function (res){
                if (atomic_mass[res]){
                    let ejected = global.interstellar.mass_ejector[res];
                    if (total + ejected > p_on['mass_ejector'] * 1000){
                        ejected = p_on['mass_ejector'] * 1000 - total;
                    }
                    total += ejected;

                    if (ejected > 0){
                        breakdown.p.consume[res][loc('interstellar_blackhole_name')] = -(ejected);
                    }

                    if (ejected * time_multiplier > global.resource[res].amount){
                        ejected = global.resource[res].amount / time_multiplier;
                    }
                    if (ejected < 0){
                        ejected = 0;
                    }

                    modRes(res, -(time_multiplier * ejected));
                    mass += ejected * atomic_mass[res];
                    if (global.race.universe !== 'magic' && (res === 'Elerium' || res === 'Infernite')){
                        exotic += ejected * atomic_mass[res];
                    }
                }
            });
            global.interstellar.mass_ejector.mass = mass;
            global.interstellar.mass_ejector.total = total;

            global.interstellar.stellar_engine.mass += mass / 10000000000 * time_multiplier;
            global.interstellar.stellar_engine.exotic += exotic / 10000000000 * time_multiplier;
        }

        if (global.portal['transport'] && global.portal['purifier']){
            let total = 0;
            let supply = 0;
            let bireme_rating = global.blood['spire'] && global.blood.spire >= 2 ? 0.8 : 0.85;
            Object.keys(global.portal.transport.cargo).forEach(function (res){
                if (supplyValue[res]){
                    let shipped = global.portal.transport.cargo[res];
                    if (total + shipped > gal_on['transport'] * 5){
                        shipped = gal_on['transport'] * 5 - total;
                    }
                    total += shipped;

                    let volume = shipped * supplyValue[res].out;
                    while (volume * time_multiplier > global.resource[res].amount && volume > 0){
                        volume -= supplyValue[res].out;
                        shipped--;
                    }
                    if (volume > 0){
                        breakdown.p.consume[res][loc('portal_transport_title')] = -(volume);
                    }

                    let bireme = 1 - (bireme_rating ** (gal_on['bireme'] || 0));

                    modRes(res, -(time_multiplier * volume));
                    supply += Number(shipped * supplyValue[res].in * time_multiplier * bireme);
                }
            });
            if (global.tech['hell_lake'] && global.tech.hell_lake >= 7 && global.tech['railway']){
                supply *= 1 + (global.tech.railway / 100);
            }
            if (global.portal['mechbay']){
                for (let i = 0; i < global.portal.mechbay.active; i++) {
                    let mech = global.portal.mechbay.mechs[i];
                    if (mech.size === 'collector') {
                        supply += mechCollect(mech) * time_multiplier;
                    }
                }
            }
            global.portal.purifier.supply += supply;
            global.portal.purifier.diff = supply / time_multiplier;
            if (global.portal.purifier.supply > global.portal.purifier.sup_max){
                global.portal.purifier.supply = global.portal.purifier.sup_max;
            }
        }

        if (global.race['carnivore'] && !global.race['herbivore'] && !global.race['soul_eater'] && !global.race['artifical']){
            if (global.resource['Food'].amount > 10){
                let rotPercent = traits.carnivore.vars()[0] / 100;
                let rot = +((global.resource['Food'].amount - 10) * (rotPercent)).toFixed(3);
                if (global.city['smokehouse']){
                    rot *= 0.9 ** global.city.smokehouse.count;
                }
                modRes('Food', -(rot * time_multiplier));
                breakdown.p.consume['Food'][loc('spoilage')] = -(rot);
            }
        }

        if (global.race['gnawer']){
            let res = global.race['kindling_kindred'] || global.race['smoldering'] ? 'Stone' : 'Lumber';
            if (global.resource[res].display){
                let pop = global.resource[global.race.species].amount + global.civic.garrison.workers;
                if(global.race['high_pop']){
                    pop /= traits.high_pop.vars()[0];
                }
                let res_cost = pop * traits.gnawer.vars()[0];
                breakdown.p.consume[res][loc('trait_gnawer_bd')] = -(res_cost);
                modRes(res, -(res_cost * time_multiplier));
            }
        }

        // Consumption
        var fed = true;
        if (global.resource[global.race.species].amount >= 1 || global.city['farm'] || global.city['soul_well'] || global.city['compost'] || global.city['tourist_center'] || global.city['transmitter']){
            let food_base = 0;
            let virgo = astroSign === 'virgo' ? 1 + (astroVal('virgo')[0] / 100) : 1;

            if (global.race['artifical']){
                if (global.city['transmitter']){
                    food_base = p_on['transmitter'] * production('transmitter') * production('psychic_boost','Food');
                    breakdown.p['Food'][loc('city_transmitter')] = food_base + 'v';
                    global.city.transmitter['lpmod'] = production('transmitter') * global_multiplier * production('psychic_boost','Food');
                }
            }
            else {
                if (global.race['detritivore']){
                    if (global.city['compost']){
                        let operating = global.city.compost.on;
                        if (!global.race['kindling_kindred'] && !global.race['smoldering']){
                            let lumberIncrement = 0.5;
                            let lumber_cost = operating * lumberIncrement;

                            while (lumber_cost * time_multiplier > global.resource.Lumber.amount && lumber_cost > 0){
                                lumber_cost -= lumberIncrement;
                                operating--;
                            }

                            breakdown.p.consume.Lumber[loc('city_compost_heap')] = -(lumber_cost);
                            modRes('Lumber', -(lumber_cost * time_multiplier));
                        }
                        let c_factor = traits.detritivore.vars()[0] / 100;
                        let food_compost = operating * (1.2 + (global.tech['compost'] * c_factor));
                        food_compost *= global.city.biome === 'grassland' ? biomes.grassland.vars()[0] : 1;
                        food_compost *= global.city.biome === 'savanna' ? biomes.savanna.vars()[0] : 1;
                        food_compost *= global.city.biome === 'ashland' ? biomes.ashland.vars()[0] : 1;
                        food_compost *= global.city.biome === 'volcanic' ? biomes.volcanic.vars()[0] : 1;
                        food_compost *= global.city.biome === 'hellscape' ? biomes.hellscape.vars()[0] : 1;
                        food_compost *= global.city.ptrait.includes('trashed') ? planetTraits.trashed.vars()[0] : 1;
                        food_compost *= production('psychic_boost','Food');
                        breakdown.p['Food'][loc('city_compost_heap')] = food_compost + 'v';
                        food_base += food_compost;
                    }
                }
                else if (global.race['carnivore'] || global.race['soul_eater']){
                    let strength = weaponTechModifer();
                    let food_hunt = workerScale(global.civic.hunter.workers,'hunter');
                    food_hunt *= racialTrait(food_hunt,'hunting');
                    if (global.race['servants']){
                        let serve_hunt = global.race.servants.jobs.hunter;
                        serve_hunt *= servantTrait(global.race.servants.jobs.hunter,'hunting');
                        food_hunt += serve_hunt;
                    }
                    food_hunt *= strength * (global.race['carnivore'] ? 2 : 0.5);
                    if (global.race['ghostly']){
                        food_hunt *= 1 + (traits.ghostly.vars()[0] / 100);
                    }
                    food_hunt *= production('psychic_boost','Food');
                    breakdown.p['Food'][loc(global.race['unfathomable'] ? 'job_raider' : 'job_hunter')] = food_hunt + 'v';

                    if (global.race['carnivore'] && global.city['lodge'] && food_hunt > 0){
                        food_hunt *= 1 + (global.city.lodge.count / 20);
                        breakdown.p['Food'][`ᄂ${loc('city_lodge')}`] = (global.city.lodge.count * 5) + '%';
                    }

                    if (global.city['soul_well']){
                        let souls = global.city['soul_well'].count * (global.race['ghostly'] ? (2 + traits.ghostly.vars()[1]) : 2);
                        food_hunt += souls * production('psychic_boost','Food');
                        breakdown.p['Food'][loc('city_soul_well')] = souls + 'v';
                    }
                    food_base += food_hunt;
                }
                else if (global.race['unfathomable']){
                    if (global.city['captive_housing']){
                        let strength = weaponTechModifer();
                        let hunt = workerScale(global.civic.hunter.workers,'hunter')
                        hunt *= racialTrait(hunt,'hunting') * strength;
                        if (global.race['servants']){
                            let serve_hunt = global.race.servants.jobs.hunter * strength;
                            serve_hunt *= servantTrait(global.race.servants.jobs.hunter,'hunting');
                            hunt += serve_hunt;
                        }
                        let minHunt = hunt * 0.008;

                        if (global.city.captive_housing.cattle < global.city.captive_housing.cattleCap && hunt > 0){
                            hunt -= Math.round(global.city.captive_housing.cattle ** 1.25);
                            if (hunt < minHunt){ hunt = minHunt; }
                            global.city.captive_housing.cattleCatch += hunt * time_multiplier;
                            if (global.city.captive_housing.cattleCatch >= global.city.captive_housing.cattle ** 2){
                                global.city.captive_housing.cattle++;
                                global.city.captive_housing.cattleCatch = 0;
                            }
                            if (global.city.captive_housing.cattle > 0 && global.resource.Food.amount < global.resource.Food.max * 0.01){
                                global.city.captive_housing.cattle--;
                                modRes('Food', 1000, true);
                                global.stats.cattle++;
                            }
                        }

                        if (global.city.captive_housing.cattle > 0){
                            let food = global.city.captive_housing.cattle / 3 * production('psychic_boost','Food');
                            breakdown.p['Food'][loc('city_captive_housing_cattle_bd')] = food + 'v';
                            food_base += food;
                        }
                    }
                }
                else if (global.city['farm'] || global.race['forager']) {
                    let weather_multiplier = 1;
                    if (!global.race['submerged']){
                        if (global.city.calendar.temp === 0){
                            if (global.city.calendar.weather === 0){
                                weather_multiplier *= global.race['chilled'] ? (1 + traits.chilled.vars()[3] / 100) : 0.7;
                            }
                            else {
                                weather_multiplier *= global.race['chilled'] ? (1 + traits.chilled.vars()[4] / 100) : 0.85;
                            }
                        }
                        if (global.city.calendar.weather === 2){
                            weather_multiplier *= global.race['chilled'] ? (1 - traits.chilled.vars()[5] / 100) : 1.1;
                        }
                    }

                    if (global.race['forager']){
                        let forage = 1 + (global.tech['foraging'] ? 0.75 * global.tech['foraging'] : 0);
                        let foragers = workerScale(global.civic.forager.workers,'forager');
                        foragers *= racialTrait(foragers,'forager');
                        if (global.race['servants']){
                            let serve = global.race.servants.jobs.forager;
                            serve *= servantTrait(global.race.servants.jobs.forager,'forager');
                            foragers += serve;
                        }
                        let food_forage = foragers * forage * 0.35;
                        breakdown.p['Food'][loc('job_forager')] = food_forage + 'v';
                        food_base += food_forage;
                    }

                    if (global.city['farm']){
                        let farmers = workerScale(global.civic.farmer.workers,'farmer');
                        let farmhands = 0;
                        if (farmers > jobScale(global.city.farm.count)){
                            farmhands = farmers - jobScale(global.city.farm.count);
                            farmers = jobScale(global.city.farm.count);
                        }
                        let food = (farmers * farmerValue(true)) + (farmhands * farmerValue(false));

                        if (global.race['servants']){
                            let servants = global.race.servants.jobs.farmer;
                            let servehands = 0;
                            let open = global.city.farm.count - (farmers / (global.race['high_pop'] ? traits.high_pop.vars()[0] : 1));
                            if (servants > open){
                                servehands = servants - open;
                                servants = open;
                            }
                            food += (servants * farmerValue(true,true)) + (servehands * farmerValue(false,true));
                        }

                        let mill_multiplier = 1;
                        if (global.city['mill']){
                            let mill_bonus = global.tech['agriculture'] >= 5 ? 0.05 : 0.03;
                            let working = global.city['mill'].count - global.city['mill'].on;
                            mill_multiplier += (working * mill_bonus);
                        }

                        breakdown.p['Food'][loc('job_farmer')] = (food) + 'v';
                        food_base += (food * virgo * weather_multiplier * mill_multiplier * q_multiplier * production('psychic_boost','Food'));

                        if (food > 0){
                            breakdown.p['Food'][`ᄂ${loc('city_mill_title1')}`] = ((mill_multiplier - 1) * 100) + '%';
                            breakdown.p['Food'][`ᄂ${loc('sign_virgo')}+0`] = ((virgo - 1) * 100) + '%';
                            breakdown.p['Food'][`ᄂ${loc('morale_weather')}`] = ((weather_multiplier - 1) * 100) + '%';
                            breakdown.p['Food'][`ᄂ${loc('quarantine')}+0`] = ((q_multiplier - 1) * 100) + '%';
                        }
                    }
                }
            }

            if (global.tauceti['tau_farm'] && p_on['tau_farm']){
                let colony_val = 1 + ((support_on['colony'] || 0) * 0.5);
                let food_base = production('tau_farm','food') * p_on['tau_farm'] * production('psychic_boost','Food');
                let delta = food_base * global_multiplier * colony_val;

                breakdown.p['Food'][loc('tau_home_tau_farm')] = food_base + 'v';
                if (food_base > 0){
                    breakdown.p['Food'][`ᄂ${loc('tau_home_colony')}`] = ((colony_val - 1) * 100) + '%';
                }

                modRes('Food', delta * time_multiplier);
            }

            let hunting = 0;
            if (global.tech['military']){
                hunting = (global.race['herbivore'] && !global.race['carnivore']) || global.race['artifical'] ? 0 : armyRating(garrisonSize(),'hunting') / 3;
                hunting *= production('psychic_boost','Food');
            }

            let biodome = 0;
            let red_synd = syndicate('spc_red');
            if (global.tech['mars']){
                biodome = support_on['biodome'] * workerScale(global.civic.colonist.workers,'colonist') * production('biodome','food') * production('psychic_boost','Food');
                if (global.race['cataclysm'] || global.race['orbit_decayed']){
                    biodome += support_on['biodome'] * production('biodome','cat_food') * production('psychic_boost','Food');
                }
            }

            breakdown.p['Food'][actions.space.spc_red.biodome.title()] = biodome + 'v';
            if (biodome > 0){
                breakdown.p['Food'][`ᄂ${loc('space_syndicate')}+0`] = -((1 - red_synd) * 100) + '%';
                breakdown.p['Food'][`ᄂ${loc('space_red_ziggurat_title')}+0`] = ((zigVal - 1) * 100) + '%';
                breakdown.p['Food'][`ᄂ${loc('sign_virgo')}+0`] = ((virgo - 1) * 100) + '%';
            }

            let generated = food_base + (hunting * q_multiplier) + (biodome * red_synd * zigVal * virgo);
            generated *= global_multiplier;

            let soldiers = global.civic.garrison.workers;
            if (global.race['parasite'] && !global.tech['isolation']){
                soldiers -= 2;
                if (soldiers < 0){
                    soldiers = 0;
                }
            }

            let consume = 0;
            let food_consume_mod = 1;
            if(global.race['gluttony']){
                food_consume_mod *= 1 + traits.gluttony.vars()[0] / 100;
            }
            if (global.race['high_metabolism']){
                food_consume_mod *= 1 + (traits.high_metabolism.vars()[0] / 100);
            }
            if (global.race['sticky']){
                food_consume_mod *= 1 - (traits.sticky.vars()[0] / 100);
            }
            let pingFathom = fathomCheck('pinguicula');
            if (pingFathom > 0){
                food_consume_mod *= 1 - (traits.sticky.vars(1)[0] / 100 * pingFathom);
            }
            if (global.race['photosynth']){
                switch(global.city.calendar.weather){
                    case 0:
                        food_consume_mod *= global.city.calendar.temp === 0 ? 1 : (1 - (traits.photosynth.vars()[2] / 100));
                        break;
                    case 1:
                        food_consume_mod *= 1 - (traits.photosynth.vars()[1] / 100);
                        break;
                    case 2:
                        food_consume_mod *= 1 - (traits.photosynth.vars()[0] / 100);
                        break;
                }
            }
            if (global.race['ravenous']){
                food_consume_mod *= 1 + (traits.ravenous.vars()[0] / 100);
            }
            if (global.race['hibernator'] && global.city.calendar.season === 3){
                food_consume_mod *= 1 - (traits.hibernator.vars()[0] / 100);
            }
            if (global.race['high_pop']){
                food_consume_mod /= traits.high_pop.vars()[0];
            }
            let banquet = 1;
            if(global.city.banquet){
                if(global.city.banquet.on){
                    banquet *= ((global.city.banquet.count >= 5 ? 1.02 : 1.022)**global.city.banquet.strength);
                }
                else{
                    global.city.banquet.strength = 0;
                }
            }

            let ravenous = 0;
            let tourism = 0;
            let spaceport = 0;
            let starport = 0;
            let starbase = 0;
            let space_station = 0;
            let space_marines = 0;
            let embassy = 0;
            let zoo = 0;
            let restaurant = 0;
            if(!global.race['fasting']){
                consume = (global.resource[global.race.species].amount + soldiers - ((global.civic.unemployed.workers + workerScale(global.civic.hunter.workers,'hunter')) * 0.5)) * food_consume_mod;
                if (global.race['forager']){
                    consume -= workerScale(global.civic.forager.workers,'forager');
                }
                if(global.race['ravenous']){
                    ravenous = (global.resource.Food.amount / traits.ravenous.vars()[1]);
                }
                breakdown.p.consume.Food[flib('name')] = -(consume + ravenous);
                if(global.city.banquet && global.city.banquet.on){
                    consume = Math.max(consume, 100); //minimum consumption for banquet hall
                }
                if(consume * banquet + ravenous >= global.resource.Food.amount){
                    if(global.city.banquet && banquet > 1){
                        global.city.banquet.strength = 0;
                    }
                }
                else{
                    if(banquet > 1){
                        breakdown.p.consume.Food[`${loc('city_banquet')}`] = -(consume*(banquet-1));
                    }
                    consume *= banquet;
                }

                if (global.city['tourist_center']){
                    tourism = global.city['tourist_center'].on * 50;
                    breakdown.p.consume.Food[loc('tech_tourism')] = -(tourism);
                }

                if (global.space['spaceport']){
                    spaceport = p_on['spaceport'] * (global.race['cataclysm'] || global.race['orbit_decayed'] ? 2 : 25);
                    breakdown.p.consume.Food[loc('space_red_spaceport_title')] = -(spaceport);
                }

                if (global.interstellar['starport']){
                    starport = p_on['starport'] * 100;
                    breakdown.p.consume.Food[loc('interstellar_alpha_starport_title')] = -(starport);
                }

                if (global.galaxy['starbase']){
                    starbase = p_on['s_gate'] * p_on['starbase'] * 250;
                    breakdown.p.consume.Food[loc('galaxy_starbase')] = -(starbase);
                }

                if (global.space['space_station']){
                    space_station = p_on['space_station'] * (global.race['cataclysm'] ? 1 : 10);
                    breakdown.p.consume.Food[loc('space_belt_station_title')] = -(space_station);
                }

                if (global.space['space_barracks'] && !global.race['cataclysm']){
                    space_marines = global.space.space_barracks.on * 10;
                    breakdown.p.consume.Food[loc('tech_space_marines_bd')] = -(space_marines);
                }

                if (global.galaxy['embassy']){
                    embassy = p_on['s_gate'] * p_on['embassy'] * 7500;
                    breakdown.p.consume.Food[loc('galaxy_embassy')] = -(embassy);
                }

                if (global.interstellar['zoo']){
                    zoo = int_on['zoo'] * 12000;
                    breakdown.p.consume.Food[loc('tech_zoo')] = -(zoo);
                }

                if (global.eden['restaurant']){
                    restaurant = p_on['restaurant'] * 250000;
                    breakdown.p.consume.Food[loc('eden_restaurant_bd')] = -(restaurant);
                }
            }

            breakdown.p['Food'][loc('soldiers')] = hunting + 'v';
            if (hunting > 0){
                breakdown.p['Food'][`ᄂ${loc('quarantine')}+1`] = ((q_multiplier - 1) * 100) + '%';
            }
            if(global.race['fasting']){
                breakdown.p['Food'][`${loc('evo_challenge_fasting')}`] = '-100%';
                generated *= 0;
            }

            let delta = generated - consume - ravenous - tourism - spaceport - starport - starbase - space_station - space_marines - embassy - zoo - restaurant;

            if (!modRes('Food', delta * time_multiplier) || global.race['fasting']){
                if (global.race['anthropophagite'] && global.resource[global.race.species].amount > 1 && !global.race['fasting']){
                    global.resource[global.race.species].amount--;
                    modRes('Food', 10000 * traits.anthropophagite.vars()[0]);
                    global.stats.murders++;
                    blubberFill(1);
                }
                else {
                    fed = false;
                    if(global.resource[global.race.species].amount > 0){
                        let threshold = 1.25;
                        let digestion = 0;
                        let humpback = 0;
                        let meditators = 0;
                        let atrophy = 0;
                        let infusion = 1;
                        if (global.race['slow_digestion']){
                            digestion += traits.slow_digestion.vars()[0];
                        }
                        let fathom = fathomCheck('slitheryn');
                        if (fathom > 0){
                            digestion += traits.slow_digestion.vars(1)[0] * fathom;
                        }
                        if (global.race['humpback']){
                            humpback = traits.humpback.vars()[0];
                        }
                        if(global.race['fasting']){
                            meditators = highPopAdjust(global.civic.meditator.workers) * 0.03;
                        }
                        if (global.race['atrophy']){
                            atrophy = traits.atrophy.vars()[0];
                        }
                        if(global.portal['dish_life_infuser'] && global.portal['dish_life_infuser'].on){
                            infusion = 0.95 ** global.portal['dish_life_infuser'].on;
                        }
                        threshold += digestion + humpback + meditators;
                        threshold -= atrophy;
                        threshold *= infusion
                        if(global.race['fasting']){
                            let base = global.resource[global.race.species].amount/100;
                            breakdown.p.consume[global.race.species][global.resource[global.race.species].name] = -(base).toFixed(2);
                            breakdown.p.consume[global.race.species][loc('genelab_traits')] = (1 - food_consume_mod) * (base).toFixed(2);
                            breakdown.p.consume[global.race.species][loc('Threshold')] = (threshold).toFixed(2);
                            global.resource[global.race.species].delta = -(base * food_consume_mod - threshold) * time_multiplier;
                            /*for(const x in breakdown.p.consume[global.race.species]){
                                breakdown.p.consume[global.race.species][x] = (breakdown.p.consume[global.race.species][x] / time_multiplier).toFixed(2);
                            }*/
                        }
                        // threshold can be thought of as the inverse of nutrition ratio per unit of food.
                        // So if the generated food doesn't have enough nutrition for the consuming population, they starve.
                        if (Math.rand(0, 10) === 0){
                            if(global.race['fasting']){
                                let starved = (global.resource[global.race.species].amount) / 100 * food_consume_mod - threshold;
                                if(starved < 0){
                                    starved = 0;
                                }
                                if(starved%1 > Math.random()){
                                    starved = Math.ceil(starved);
                                }
                                else{
                                    starved = Math.floor(starved);
                                }
                                if(starved > global.resource[global.race.species].amount){
                                    starved = global.resource[global.race.species].amount;
                                }
                                global.resource[global.race.species].amount -= starved;
                                global.stats.starved += starved;
                                blubberFill(starved);
                            }
                            else if (generated < consume / threshold){
                                global['resource'][global.race.species].amount--;
                                global.stats.starved++;
                                blubberFill(1);
                            }
                        }
                    }
                }
            }

            if (global.race['anthropophagite'] && global.resource[global.race.species].amount > 1 && Math.rand(0,400) === 0){
                global.resource[global.race.species].amount--;
                modRes('Food', 10000 * traits.anthropophagite.vars()[0]);
                global.stats.murders++;
                blubberFill(1);
            }
        }

        // Fortress Repair
        if (global.portal['fortress'] && global.portal.fortress.walls < 100){
            if (modRes('Stone', -(200 * time_multiplier))){
                global.portal.fortress.repair++;
                breakdown.p.consume.Stone[loc('portal_fortress_name')] = -200;
            }
            if (global.portal.fortress.repair >= actions.portal.prtl_fortress.info.repair()){
                global.portal.fortress.repair = 0;
                global.portal.fortress.walls++;
            }
        }

        // Energy Recharge
        if (global.race['psychic'] && global.resource.Energy.display){
            let energy_bd = {};
            let charge = traits.psychic.vars()[2];
            energy_bd[loc('trait_psychic_name')] = charge + 'v';
            modRes(`Energy`, (charge * time_multiplier));
            breakdown.p['Energy'] = energy_bd;
        }

        // Citizen Growth
        if (global.civic.homeless > 0){
            let missing = Math.min(global.civic.homeless, global.resource[global.race.species].max - global.resource[global.race.species].amount);
            global.civic.homeless -= missing;
            global.resource[global.race.species].amount += missing;
        }
        else if (((fed && global['resource']['Food'].amount > 0) || global.race['fasting']) && global['resource'][global.race.species].max > global['resource'][global.race.species].amount){
            if (global.race['artifical'] || (global.race['spongy'] && global.city.calendar.weather === 0)){
                // Do Nothing
            }
            else if (global.race['parasite'] && global.city.calendar.wind === 0 && !global.race['cataclysm'] && !global.race['orbit_decayed']){
                // Do Nothing
            }
            else if (global.race['vax'] && global.race.vax >= 100){
                // Do Nothing
            }
            else {
                let lowerBound = global.tech['reproduction'] ? global.tech['reproduction'] : 0;
                let upperBound = global['resource'][global.race.species].amount;

                if (global.tech['reproduction'] && date.getMonth() === 1 && date.getDate() === 14){
                    lowerBound += 5;
                }
                if (global.race['fast_growth']){
                    lowerBound *= traits.fast_growth.vars()[0];
                    lowerBound += traits.fast_growth.vars()[1];
                }
                if (global.race['spores'] && global.city.calendar.wind === 1){
                    if (global.race['parasite']){
                        lowerBound += traits.spores.vars()[2];
                    }
                    else {
                        lowerBound += traits.spores.vars()[0];
                        lowerBound *= traits.spores.vars()[1];
                    }
                }
                if (global.tech['reproduction'] && global.tech.reproduction >= 2 && global.city['hospital']){
                    lowerBound += global.city.hospital.count;
                }
                if (global.genes['birth']){
                    lowerBound += global.genes['birth'];
                }
                if (global.race['promiscuous']){
                    lowerBound += traits.promiscuous.vars()[0] * global.race['promiscuous'];
                }
                if(global.race['fasting']){
                    lowerBound += highPopAdjust(global.civic.meditator.workers) * 0.15;
                }
                if(global.city.banquet && global.city.banquet.on && global.city.banquet.count >= 1){
                    lowerBound *= 1 + (global.city.banquet.strength ** 0.75) / 100;
                }
                if (astroSign === 'libra'){
                    lowerBound *= 1 + (astroVal('libra')[0] / 100);
                }
                if (global.race['high_pop']){
                    lowerBound *= traits.high_pop.vars()[2];
                    upperBound /= jobScale(1);
                }
                if (global.city.biome === 'taiga'){
                    lowerBound *= biomes.taiga.vars()[1];
                }
                if (global.city.ptrait.includes('toxic')){
                    upperBound *= planetTraits.toxic.vars()[1];
                }
                if (global.race['parasite'] && (global.race['cataclysm'] || global.race['orbit_decayed'])){
                    lowerBound = Math.round(lowerBound / 5);
                    upperBound *= 3;
                }

                upperBound *= (3 - (2 ** time_multiplier));
                if(Math.rand(0, upperBound) <= lowerBound){
                    global['resource'][global.race.species].amount++;
                }
            }
        }

        if (global.space['shipyard'] && global.space.shipyard['ships']){
            let fuels = {
                Oil: 0,
                Helium_3: 0,
                Uranium: 0,
                Elerium: 0
            };
            global.space.shipyard.ships.forEach(function(ship){
                if (ship.location !== 'spc_dwarf' || ship.transit !== 0){
                    let fuel = shipFuelUse(ship);
                    if (fuel.res && fuel.burn > 0){
                        if (fuel.burn * time_multiplier < global.resource[fuel.res].amount + (global.resource[fuel.res].diff > 0 ? global.resource[fuel.res].diff * time_multiplier : 0)){
                            modRes(fuel.res, -(fuel.burn * time_multiplier));
                            ship.fueled = true;
                            fuels[fuel.res] += fuel.burn;
                        }
                        else {
                            ship.fueled = false;
                        }
                    }
                    else {
                        ship.fueled = true;
                    }
                }
            });

            breakdown.p.consume.Oil[loc('outer_shipyard_fleet')] = -(fuels.Oil);
            breakdown.p.consume.Helium_3[loc('outer_shipyard_fleet')] = -(fuels.Helium_3);
            breakdown.p.consume.Uranium[loc('outer_shipyard_fleet')] = -(fuels.Uranium);
            breakdown.p.consume.Elerium[loc('outer_shipyard_fleet')] = -(fuels.Elerium);
        }

        if (global.race['emfield']){
            if (global.race['discharge'] && global.race['discharge'] > 0){
                global.race.discharge--;
            }
            else {
                global.race.emfield++;
                if (Math.rand(0,500) === 0){
                    global.race['discharge'] = global.race.emfield;
                    global.race.emfield = 1;
                }
            }
        }

        // Resource Income
        let hunger = fed ? 1 : 0.5;
        if (global.race['angry'] && fed === false){
            hunger -= traits.angry.vars()[0] / 100;
        }
        if (global.race['malnutrition'] && fed === false){
            hunger += traits.malnutrition.vars()[0] / 100;
        }
        if(global.portal['dish_soul_steeper'] && global.portal['dish_soul_steeper'].on){
            hunger -= (0.03 + (global.race['malnutrition'] ? 0.01 : 0) + (global.race['angry'] ? -0.01 : 0)) * global.portal['dish_soul_steeper'].on;
        }
        hunger = Math.max(hunger, 0);

        // Furs
        if (global.resource.Furs.display){
            if (global.race['evil'] || global.race['artifical'] || global.race['unfathomable']){
                let weapons = weaponTechModifer();
                let hunters = workerScale(global.civic.hunter.workers,'hunter');
                hunters *= racialTrait(hunters,'hunting');
                if (global.race['servants']){
                    let serve = jobScale(global.race.servants.jobs.hunter);
                    serve *= servantTrait(global.race.servants.jobs.hunter,'hunting');
                    hunters += serve;
                }
                if (global.city.biome === 'oceanic'){
                    hunters *= biomes.oceanic.vars()[2];
                }
                else if (global.city.biome === 'tundra'){
                    hunters *= biomes.tundra.vars()[0];
                }
                hunters *= weapons / 20;
                hunters *= production('psychic_boost','Furs');
                breakdown.p['Furs'][loc(global.race['unfathomable'] ? 'job_raider' : 'job_hunter')] = hunters  + 'v';
                if (hunters > 0){
                    breakdown.p['Furs'][`ᄂ${loc('quarantine')}+0`] = ((q_multiplier - 1) * 100) + '%';
                }
                modRes('Furs', hunters * hunger * global_multiplier * time_multiplier * q_multiplier);

                if (!global.race['soul_eater'] && global.race['evil']){
                    let reclaimers = workerScale(global.civic.lumberjack.workers,'lumberjack');
                    reclaimers *= racialTrait(reclaimers,'lumberjack');

                    if (global.race['servants']){
                        let serve = global.race.servants.jobs.lumberjack;
                        serve *= servantTrait(global.race.servants.jobs.lumberjack,'lumberjack');
                        reclaimers += serve;
                    }

                    reclaimers /= 4;
                    reclaimers *= production('psychic_boost','Furs');
                    breakdown.p['Furs'][loc('job_reclaimer')] = reclaimers  + 'v';
                    if (reclaimers > 0){
                        breakdown.p['Furs'][`ᄂ${loc('quarantine')}+1`] = ((q_multiplier - 1) * 100) + '%';
                    }
                    modRes('Furs', reclaimers * hunger * global_multiplier * time_multiplier * q_multiplier);
                }
            }

            let hunting = armyRating(garrisonSize(),'hunting') / 10;
            if (global.city.biome === 'oceanic'){
                hunting *= biomes.oceanic.vars()[2];
            }
            else if (global.city.biome === 'tundra'){
                hunting *= biomes.tundra.vars()[0];
            }
            hunting *= production('psychic_boost','Furs');

            breakdown.p['Furs'][loc('soldiers')] = hunting  + 'v';
            if (hunting > 0){
                breakdown.p['Furs'][`ᄂ${loc('quarantine')}+2`] = ((q_multiplier - 1) * 100) + '%';
            }
            modRes('Furs', hunting * hunger * global_multiplier * q_multiplier * time_multiplier);

            if (global.race['forager']){
                let forage = 1 + (global.tech['foraging'] ? 0.5 * global.tech['foraging'] : 0);
                let foragers = workerScale(global.civic.forager.workers,'forager');
                foragers *= racialTrait(foragers,'forager');

                if (global.race['servants']){
                    let serve = global.race.servants.jobs.forager;
                    serve *= servantTrait(global.race.servants.jobs.forager,'forager');
                    foragers += serve;
                }

                let forage_base = foragers * forage * 0.05 * production('psychic_boost','Furs');
                breakdown.p['Furs'][loc('job_forager')] = forage_base + 'v';
                if (forage_base > 0){
                    breakdown.p['Furs'][`ᄂ${loc('quarantine')}+3`] = ((q_multiplier - 1) * 100) + '%';
                }
                modRes('Furs', forage_base * hunger * q_multiplier * time_multiplier);
            }
        }

        if (global.resource.Furs.display && global.tech['isolation'] && global.tauceti['womling_farm']){
            let base = global.tauceti.womling_farm.farmers * production('psychic_boost','Furs');
            let delta = base * global_multiplier;
            breakdown.p['Furs'][loc('tau_red_womlings')] = base + 'v';
            modRes('Furs', delta);
        }

        if (global.race['unfathomable'] && global.civic.hunter.display){
            let weapons = weaponTechModifer();
            let hunters = workerScale(global.civic.hunter.workers,'hunter');
            hunters *= racialTrait(hunters,'hunting');

            if (global.race['servants']){
                let serve = jobScale(global.race.servants.jobs.hunter);
                serve *= servantTrait(global.race.servants.jobs.hunter,'hunting');
                hunters += highPopAdjust(serve);
            }

            hunters *= weapons / 20;

            let stealable = ['Lumber','Chrysotile','Stone','Crystal','Copper','Iron','Aluminium','Cement','Coal','Oil','Uranium','Steel','Titanium','Alloy','Polymer','Iridium'];
            stealable.forEach(function(res){
                if (global.resource[res].display){
                    let raid = hunters * production('psychic_boost',res) * tradeRatio[res] / 5;
                    if (['Crystal','Uranium'].includes(res)){ raid *= 0.2; }
                    else if (['Alloy','Polymer','Iridium'].includes(res)){ raid *= 0.35; }
                    else if (['Steel','Cement'].includes(res)){ raid *= 0.85; }
                    else if (['Titanium'].includes(res)){ raid *= 0.65; }
                    breakdown.p[res][loc(global.race['unfathomable'] ? 'job_raider' : 'job_hunter')] = raid  + 'v';
                    if (raid > 0){
                        breakdown.p[res][`ᄂ${loc('quarantine')}+99`] = ((q_multiplier - 1) * 100) + '%';
                    }
                    modRes(res, raid * hunger * global_multiplier * time_multiplier * q_multiplier);
                }
            });
        }

        // Knowledge
        { //block scope
            let sundial_base = global.tech['primitive'] && global.tech['primitive'] >= 3 ? 1 : 0;
            if (global.race['ancient_ruins']){
                sundial_base++;
            }
            if (global.stats.achieve['extinct_junker'] && global.stats.achieve['extinct_junker'].l >= 1){
                sundial_base++;
            }
            if (global.city.ptrait.includes('magnetic')){
                sundial_base += planetTraits.magnetic.vars()[0];
            }
            if (global.race['ascended']){
                sundial_base += 2;
            }

            let professors_base = workerScale(global.civic.professor.workers,'professor');
            let prof_impact = global.race['studious'] ? global.civic.professor.impact + traits.studious.vars()[0] : global.civic.professor.impact;
            let fathom = fathomCheck('elven');
            if (fathom > 0){
                prof_impact += traits.studious.vars(1)[0] * fathom;
            }
            professors_base *= prof_impact
            professors_base *= global.race['pompous'] ? (1 - traits.pompous.vars()[0] / 100) : 1;
            professors_base *= racialTrait(workerScale(global.civic.professor.workers,'professor'),'science');
            if (global.tech['anthropology'] && global.tech['anthropology'] >= 3){
                professors_base *= 1 + (global.race['cataclysm'] || global.race['orbit_decayed'] ? (global.space['ziggurat'] ? templeCount(true) : 0) : templeCount()) * 0.05;
            }
            if (global.civic.govern.type === 'theocracy'){
                professors_base *= 1 - (govEffect.theocracy()[1] / 100);
            }

            let scientist_base = workerScale(global.civic.scientist.workers,'scientist');
            scientist_base *= global.civic.scientist.impact;
            scientist_base *= racialTrait(workerScale(global.civic.scientist.workers,'scientist'),'science');
            if (global.tech['science'] >= 6 && global.city['wardenclyffe']){
                let professor = workerScale(global.civic.professor.workers,'professor');
                if (global.race['high_pop']){
                    professor = highPopAdjust(professor);
                }
                scientist_base *= 1 + (professor * p_on['wardenclyffe'] * 0.01);
            }
            if (global.space['satellite']){
                scientist_base *= 1 + (global.space.satellite.count * 0.01);
            }
            if (global.civic.govern.type === 'theocracy'){
                scientist_base *= 1 - (govEffect.theocracy()[2] / 100);
            }

            let gene_consume = 0;
            if (global.arpa['sequence'] && global.arpa.sequence.on && global.arpa.sequence.time > 0 && sequenceLabs() > 0){
                let gene_cost = 50 + (global.race.mutation * 10);
                if (global.arpa.sequence.boost){
                    gene_cost *= 4;
                }
                if (gene_cost * time_multiplier <= global.resource.Knowledge.amount){
                    gene_consume = gene_cost;
                    gene_sequence = true;
                }
                else {
                    gene_sequence = false;
                }
            }
            else {
                if (global.arpa.hasOwnProperty('sequence') && global.arpa.sequence.time === null){
                    global.arpa.sequence.time = global.arpa.sequence.max;
                }
                gene_sequence = false;
            }

            let womling = global.tauceti.hasOwnProperty('womling_lab') ? global.tauceti.womling_lab.scientist * (global.tech['womling_gene'] ? 10 : 8) : 0;

            let delta = professors_base + scientist_base + womling;
            delta *= hunger * global_multiplier;
            delta += sundial_base * global_multiplier;

            breakdown.p['Knowledge'][loc('job_professor')] = professors_base + 'v';
            if (global.race.universe === 'magic'){
                breakdown.p['Knowledge'][loc('job_wizard')] = scientist_base + 'v';
            }
            else {
                breakdown.p['Knowledge'][loc('job_scientist')] = scientist_base + 'v';
            }
            breakdown.p['Knowledge'][loc('tau_red_womlings')] = womling + 'v';
            breakdown.p['Knowledge'][loc('hunger')] = ((hunger - 1) * 100) + '%';
            breakdown.p['Knowledge'][global.race['unfathomable'] ? loc('tech_moondial') : loc('tech_sundial')] = sundial_base + 'v';

            if (global.race['inspired']){
                breakdown.p['Knowledge'][loc('event_inspiration_bd')] = '100%';
                delta *= 2;
            }
            if (global.city['library']){
                let lib_multiplier = 0.05;
                let muckVal = govActive('muckraker',2);
                if (muckVal){
                    lib_multiplier -= (muckVal / 100);
                }
                if (global.race['autoignition']){
                    lib_multiplier -= (traits.autoignition.vars()[0] / 100);
                    if (lib_multiplier < 0){
                        lib_multiplier = 0;
                    }
                }

                let library_mult = 1 + (global.city.library.count * lib_multiplier);
                breakdown.p['Knowledge'][loc('city_library')] = ((library_mult - 1) * 100) + '%';
                delta *= library_mult;
            }
            if (astroSign === 'gemini'){
                let astro_mult = 1 + (astroVal('gemini')[0] / 100);
                breakdown.p['Knowledge'][loc(`sign_${astroSign}`)] = ((astro_mult - 1) * 100) + '%';
                delta *= astro_mult;
            }
            if (global.tech['isolation'] && support_on['infectious_disease_lab']){
                let lab_mult = 1 + support_on['infectious_disease_lab'] * 0.75;
                breakdown.p['Knowledge'][actions.tauceti.tau_home.infectious_disease_lab.title()] = ((lab_mult - 1) * 100) + '%';
                delta *= lab_mult;
            }
            if (global.civic.govern.type === 'technocracy'){
                breakdown.p['Knowledge'][loc('govern_technocracy')] = govEffect.technocracy()[2] + '%';
                delta *= 1 + (govEffect.technocracy()[2] / 100);
            }

            if (gene_consume > 0) {
                delta -= gene_consume;
                breakdown.p.consume.Knowledge[loc('genome_bd')] = -(gene_consume);
            }

            modRes('Knowledge', delta * time_multiplier);

            if (global.tech['tau_gas2'] && global.tech.tau_gas2 >= 6 && (!global.tech['alien_data'] || global.tech.alien_data < 6) && global.tauceti['alien_space_station'] && p_on['alien_space_station']){
                let focus = (global.tauceti.alien_space_station.focus / 100) * delta
                breakdown.p.consume.Knowledge[loc('tau_gas2_alien_station')] = -(focus);
                modRes('Knowledge', -(focus) * time_multiplier);
                global.tauceti.alien_space_station.decrypted += +(focus).toFixed(3);
                global.stats.know += +(focus).toFixed(0);
                if (global.tauceti.alien_space_station.decrypted >= (global.race['lone_survivor'] ? 1000000 : 250000000) && !global.tech['alien_data']){
                    global.tech['alien_data'] = 1;
                    messageQueue(loc('tau_gas2_alien_station_data1',[loc('tech_dist_womling')]),'success',false,['progress']);
                    drawTech();
                }
                else if (global.tauceti.alien_space_station.decrypted >= (global.race['lone_survivor'] ? 2000000 : 500000000) && global.tech['alien_data'] && global.tech.alien_data === 1){
                    global.tech.alien_data = 2;
                    global.race.tau_food_item = Math.rand(0,10);
                    messageQueue(loc('tau_gas2_alien_station_data2',[loc(`tau_gas2_alien_station_data2_r${global.race.tau_food_item || 0}`)]),'success',false,['progress']);
                    drawTech();
                }
                else if (global.tauceti.alien_space_station.decrypted >= (global.race['lone_survivor'] ? 3000000 : 750000000) && global.tech['alien_data'] && global.tech.alien_data === 2){
                    global.tech.alien_data = 3;
                    messageQueue(loc('tau_gas2_alien_station_data3'),'success',false,['progress']);
                    drawTech();
                }
                else if (global.tauceti.alien_space_station.decrypted >= (global.race['lone_survivor'] ? 4800000 : 1200000000) && global.tech['alien_data'] && global.tech.alien_data === 3){
                    global.tech.alien_data = 4;
                    global.race.tau_junk_item = Math.rand(0,10);
                    messageQueue(loc('tau_gas2_alien_station_data4',[loc(`tau_gas2_alien_station_data4_r${global.race.tau_junk_item || 0}`)]),'success',false,['progress']);
                    drawTech();
                }
                else if (global.tauceti.alien_space_station.decrypted >= (global.race['lone_survivor'] ? 6000000 : 1500000000) && global.tech['alien_data'] && global.tech.alien_data === 4){
                    global.tech.alien_data = 5;
                    messageQueue(loc('tau_gas2_alien_station_data5'),'success',false,['progress']);
                    drawTech();
                }
                else if (global.tauceti.alien_space_station.decrypted >= (global.race['lone_survivor'] ? 10000000 : 2500000000) && global.tech['alien_data'] && global.tech.alien_data === 5){
                    global.tech.alien_data = 6;
                    global.tauceti.alien_space_station.decrypted = 2500000000;
                    if (global.race['lone_survivor']){
                        global.settings.tau.star = true;
                        global.tech['matrix'] = 2;
                        global.tauceti['ringworld'] = { count: 0 };
                        messageQueue(loc('tau_gas2_alien_station_data6_alt'),'success',false,['progress']);
                    }
                    else {
                        messageQueue(loc('tau_gas2_alien_station_data6'),'success',false,['progress']);
                    }
                    drawTech();
                }
            }
        }

        // Omniscience
        if (global.resource.Omniscience.display){
            if (support_on['research_station']){
                let ghost_base = workerScale(global.civic.ghost_trapper.workers,'ghost_trapper');
                ghost_base *= racialTrait(ghost_base,'science');
                ghost_base *= global.race['pompous'] ? (1 - traits.pompous.vars()[0] / 100) : 1;

                let ghost_gain = support_on['research_station'] * ghost_base * 0.0000325;
                breakdown.p['Omniscience'][loc('eden_research_station_title')] = ghost_gain + 'v';

                let delta = ghost_gain;
                delta *= hunger * global_multiplier;

                modRes('Omniscience', delta * time_multiplier);
            }

            if (global.tech['science'] && global.tech.science >= 23){
                let scientist = workerScale(global.civic.scientist.workers,'scientist');
                scientist *= racialTrait(scientist,'science');
                scientist *= global.race['pompous'] ? (1 - traits.pompous.vars()[0] / 100) : 1;

                let sci_gain = scientist * 0.000707;
                breakdown.p['Omniscience'][global.civic.scientist.name] = sci_gain + 'v';

                let delta = sci_gain;
                delta *= hunger * global_multiplier;

                modRes('Omniscience', delta * time_multiplier);
            }
        }
    }
}
