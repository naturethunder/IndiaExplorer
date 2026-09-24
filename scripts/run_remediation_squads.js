/**
 * scripts/run_remediation_squads.js
 *
 * Runs the 4 Multi-Agent Squads for all 19 priority destinations.
 */

const fs = require('fs');
const path = require('path');
const { initGlobalCollisions, remediateDestination } = require('./remediate_19_priority_destinations');

// SQUAD 1 CONFIGURATIONS: Historical Forts
const squad1Forts = [
  {
    filename: 'vardhangad-fort.json',
    config: {
      title: 'Vardhangad Fort',
      galleryQueries: [
        'Maharashtra hill fort ruins',
        'Sahyadri mountain fort stone bastion',
        'Western Ghats ancient fort wall',
        'Satara historic fortress landscape',
        'Indian hilltop stone fortification'
      ],
      galleryFallbacks: [
        'Maharashtra trekking fort stone wall',
        'ancient Indian hill fortress ramparts',
        'Western Ghats green mountain fortress'
      ],
      galleryAlts: [
        'Vardhangad Fort stone ramparts overlooking Sahyadri mountain ranges',
        'Historic Maratha era stone bastion and entrance gateway at Vardhangad Fort',
        'Panoramic view of rugged Sahyadri hill landscape from Vardhangad Fort summit',
        'Ancient stone fortification walls perched high above the Satara plateau',
        'Scenic trekking trail and outer defenses of historic Vardhangad Fort'
      ],
      placeConfigs: {
        'Koregaon': {
          queries: ['Satara countryside landscape Maharashtra', 'Maharashtra rural scenic fields'],
          fallbacks: ['Western Ghats hills Maharashtra', 'Deccan plateau green landscape']
        },
        'Kanherkhed': {
          queries: ['Maharashtra historic village temple', 'ancient stone temple Maharashtra rural'],
          fallbacks: ['Sahyadri rural village vista', 'Maharashtra landscape sunny']
        },
        'Jihe': {
          queries: ['Sahyadri green valley river Maharashtra', 'Maharashtra rustic nature trail'],
          fallbacks: ['Satara district mountain river', 'Maharashtra countryside trail']
        }
      }
    }
  },
  {
    filename: 'madikeri-fort.json',
    config: {
      title: 'Madikeri Fort',
      galleryQueries: [
        'Madikeri Fort Coorg stone walls',
        'Coorg Scotland of India misty hills',
        'historic hill fort Kodagu Karnataka',
        'Coorg coffee plantation mountain vista',
        'historic colonial church palace Coorg'
      ],
      galleryFallbacks: [
        'Kodagu misty Western Ghats landscape',
        'Karnataka heritage stone monument palace',
        'Coorg nature lush green valley'
      ],
      galleryAlts: [
        'Madikeri Fort historic stone walls and ramparts in Kodagu',
        'St Marks Church museum inside the Madikeri Fort complex',
        'Life-size stone elephant statues guarding Madikeri Fort entrance',
        'Panoramic vista of misty Coorg valleys from Madikeri Fort battlements',
        'Heritage palace and clock tower within the historic Madikeri Fort'
      ],
      placeConfigs: {
        "St. Mark's Church, Mercara": {
          queries: ['gothic colonial stone church India', 'heritage stone cathedral church India'],
          fallbacks: ['historic colonial architecture Karnataka', 'old stone chapel interior stained glass']
        },
        'Coorg State': {
          queries: ['Coorg coffee estate plantation green', 'Kodagu misty green mountain hills'],
          fallbacks: ['Western Ghats lush green coffee estate', 'Karnataka scenic hill station']
        },
        'Madikeri': {
          queries: ['Madikeri town misty viewpoint Coorg', 'Kodagu landscape hills sunset'],
          fallbacks: ['Coorg hill station town panoramic', 'Karnataka Western Ghats valley']
        },
        "Raja's Seat": {
          queries: ['Rajas Seat Coorg garden view sunset', 'Rajas Seat viewpoint misty valley hills'],
          fallbacks: ['flower garden hill station mountain sunset', 'Coorg sunset viewpoint Western Ghats']
        },
        'Abbey Falls': {
          queries: ['Abbey Falls Coorg lush waterfall', 'Coorg water falls Western Ghats forest'],
          fallbacks: ['jungle waterfall cascade lush green', 'South India rainforest waterfall']
        },
        'Jawahar Navodaya Vidyalaya, Kodagu': {
          queries: ['educational campus greenery hills India', 'school campus mountains nature India'],
          fallbacks: ['lush green campus walkway trees', 'hill station campus mountain vista']
        }
      }
    }
  },
  {
    filename: 'gagron-fort.json',
    config: {
      title: 'Gagron Fort',
      galleryQueries: [
        'Gagron Fort water fort river Rajasthan',
        'Gagron Fort Jhalawar stone ramparts',
        'Rajasthan river fort UNESCO heritage',
        'Jhalawar ancient stone palace fort',
        'historic fortress confluence river Rajasthan'
      ],
      galleryFallbacks: [
        'Rajasthan historic stone fortress river',
        'water fortress stone bastion India',
        'ancient medieval fort India river'
      ],
      galleryAlts: [
        'Gagron Fort UNESCO World Heritage water fort surrounded by Ahu and Kali Sindh rivers',
        'Imposing stone bastions and ramparts of Gagron Fort rising from riverbed',
        'Scenic panoramic view of Gagron water fort against the sunset sky',
        'Ancient stone gateways and battlements of Gagron Fort in Jhalawar',
        'Confluence of Ahu and Kali Sindh rivers encircling Gagron Fort'
      ],
      placeConfigs: {
        'Ahu River': {
          queries: ['river flowing rocky banks Rajasthan', 'peaceful river rocky landscape sunset India'],
          fallbacks: ['tranquil river water flowing stone', 'scenic Indian riverbank rocks']
        },
        'Garh Palace, Jhalawar': {
          queries: ['Garh Palace Jhalawar heritage courtyard', 'Rajasthan royal palace stone architecture'],
          fallbacks: ['ornate carved stone palace courtyard Rajasthan', 'historic royal durbar hall India']
        },
        'Jhalawar': {
          queries: ['Jhalawar historic town Rajasthan', 'historic heritage street Rajasthan architecture'],
          fallbacks: ['traditional sandstone architecture Rajasthan', 'heritage city gate Rajasthan']
        },
        'Jhalawar State': {
          queries: ['Rajasthan royal heritage fort palace', 'princely state palace architecture India'],
          fallbacks: ['sandstone royal cenotaphs chhatri Rajasthan', 'historic Rajput architecture']
        },
        'Jhalrapatan': {
          queries: ['Jhalrapatan Sun temple stone carving', 'ancient carved stone temple shikhara Rajasthan'],
          fallbacks: ['intricate ancient Hindu temple stone relief', 'historic medieval temple Rajasthan']
        }
      }
    }
  },
  {
    filename: 'sinhagad.json',
    config: {
      title: 'Sinhagad',
      galleryQueries: [
        'Sinhagad Fort Pune Kalyan Darwaza',
        'Sinhagad fort cliff edge Sahyadri',
        'Sinhagad hill fortress clouds monsoon',
        'Pune Sahyadri mountain fort ruins',
        'historic Maratha fortress Sinhagad'
      ],
      galleryFallbacks: [
        'monsoon greenery Maharashtra fort',
        'Sahyadri mountain peak fort walls',
        'Western Ghats historic mountain bastion'
      ],
      galleryAlts: [
        'Sinhagad Fort majestic Kalyan Darwaza gateway overlooking the Sahyadri mountains',
        'Dramatic cliff-edge battlements of Sinhagad Fort shrouded in monsoon mist',
        'Panoramic view of Khadakwasla backwaters from Sinhagad Fort summit',
        'Historic Maratha stone bastions and memorial on Sinhagad Fort plateau',
        'Sunset over the rugged Western Ghats ridge from Sinhagad Fort ramparts'
      ],
      placeConfigs: {
        'Donje, Maharashtra': {
          queries: ['Sinhagad foothills village green trail', 'rural Maharashtra hill base green trail'],
          fallbacks: ['countryside trekking path Sahyadri hills', 'green agricultural fields Pune rural']
        },
        'Zapurza Museum of Art & Culture': {
          queries: ['art museum modern cultural gallery India', 'outdoor sculpture park amphitheatre lake'],
          fallbacks: ['contemporary art museum architecture garden', 'cultural center museum exhibition hall']
        },
        'National Defence Academy (India)': {
          queries: ['military academy grand administrative building', 'prestigious defence academy parade ground'],
          fallbacks: ['grand colonial administrative facade India', 'majestic institutional architecture lawns']
        }
      }
    }
  }
];

// SQUAD 2 CONFIGURATIONS: Sacred Shrines & Temples
const squad2Temples = [
  {
    filename: 'veerbhadra-temple.json',
    config: {
      title: 'Veerbhadra Temple',
      galleryQueries: [
        'Lepakshi Veerbhadra temple stone pillars',
        'Lepakshi Nandi monolithic bull carving',
        'hanging pillar Lepakshi temple Vijayanagara',
        'Nagalinga monolithic rock sculpture Lepakshi',
        'Vijayanagara stone temple intricate ceiling fresco'
      ],
      galleryFallbacks: [
        'ancient Vijayanagara temple architecture stone',
        'intricately carved Hindu temple stone pillars',
        'monolithic granite temple sculpture South India'
      ],
      galleryAlts: [
        'Veerbhadra Temple magnificent Vijayanagara stone pillars and carved mandapam',
        'Colossal monolithic Nandi bull carved from single granite rock at Lepakshi',
        'Famous architectural marvel hanging pillar at Veerbhadra Temple',
        'Grand multi-hooded Nagalinga serpent sculpture carved in solid rock',
        'Ancient Vijayanagara era ceiling frescoes and intricate stone relief carvings'
      ],
      placeConfigs: {
        'Dudhaganga': {
          queries: ['Dudhaganga river lush banks green', 'flowing river South India greenery boulders'],
          fallbacks: ['scenic river water flowing rocks', 'tranquil tropical river riverbank']
        },
        'Kopeshwar Temple': {
          queries: ['Kopeshwar Temple Khidrapur round hall स्वर्गमंडप', 'ancient carved stone pillars temple circular open roof'],
          fallbacks: ['intricate ancient soapstone temple carvings', 'carved stone temple ceiling star shaped']
        },
        'Panchganga River': {
          queries: ['river ghat stone steps sunrise India', 'sacred river confluence morning mist ghat'],
          fallbacks: ['peaceful river water flowing morning', 'river reflections sunrise ancient ghat']
        },
        'Diggewadi': {
          queries: ['green rural farmland South India village', 'scenic agricultural landscape sugarcane fields'],
          fallbacks: ['peaceful rural South Indian countryside', 'green meadows palm trees sunshine']
        }
      }
    }
  },
  {
    filename: 'vazhappally-maha-siva-temple.json',
    config: {
      title: 'Vazhappally Maha Siva Temple',
      galleryQueries: [
        'traditional Kerala temple architecture timber roof',
        'Kerala Hindu temple pond kalyani brass lamps',
        'ancient wooden carved Kerala temple sanctum',
        'Kerala temple gopuram traditional sloping copper roof',
        'sacred Kerala temple flagstaff deepasthambham oil lamps'
      ],
      galleryFallbacks: [
        'traditional Kerala architecture courtyard',
        'heritage temple Kerala backwaters serene',
        'Kerala temple festival night brass lamps'
      ],
      galleryAlts: [
        'Traditional sloping copper-tiled roof and timber architecture of Vazhappally Temple',
        'Historic circular Srikovil sanctum with intricate 1st millennium wooden carvings',
        'Temple Kalyani sacred water tank surrounded by lush Kerala coconut palms',
        'Ornate brass Deepasthambham multi-tiered lamp lit at dusk in temple courtyard',
        'Ancient stone inscribed courtyard and Vrishabha Vahanam shrine at Vazhappally'
      ],
      placeConfigs: {
        'Vazhappally': {
          queries: ['Kerala traditional village street coconut trees', 'Changanassery Kerala town green quiet'],
          fallbacks: ['lush green Kerala countryside road', 'traditional Kerala town houses greenery']
        },
        'Archeparchy of Changanacherry': {
          queries: ['heritage Christian cathedral Kerala church', 'historic colonial archdiocese cathedral Kerala'],
          fallbacks: ['majestic white church facade Kerala', 'historic stone church Kerala greenery']
        },
        "St. Mary's Metropolitan Cathedral, Changanassery": {
          queries: ['St Mary Metropolitan Cathedral church tower Kerala', 'grand white cathedral gothic facade Kerala'],
          fallbacks: ['historic Catholic cathedral bell tower', 'ornate church altar cathedral interior']
        },
        'Holy Family Syro-Malabar Church, Mannila': {
          queries: ['Syro Malabar church Kerala traditional facade', 'peaceful parish church Kerala greenery'],
          fallbacks: ['white painted church bell tower tropical', 'serene Christian chapel Kerala countryside']
        },
        'Mathumoola': {
          queries: ['Kerala backwater town scenic junction', 'green scenic canal town Kerala'],
          fallbacks: ['waterway palm trees Kerala tranquil', 'peaceful rural canal Kerala']
        },
        'Changanassery': {
          queries: ['Changanassery market canal boat Kerala', 'heritage town Kerala canal coconut palms'],
          fallbacks: ['scenic backwater waterway Kerala boat', 'traditional Kerala trade market town']
        },
        'Muttar': {
          queries: ['Kuttanad backwaters paddy fields Kerala', 'emerald green rice fields canal Kerala'],
          fallbacks: ['peaceful Kerala backwaters village canoe', 'lush green Kuttanad paddy landscape']
        },
        'Perunna Subrahmanya Swami Temple': {
          queries: ['Subrahmanya Swami Temple Kerala traditional gopuram', 'traditional Kerala temple courtyard elephants procession'],
          fallbacks: ['traditional wood temple sanctum Kerala', 'sacred temple pond Kerala dusk']
        }
      }
    }
  },
  {
    filename: 'tapkeshwar-temple.json',
    config: {
      title: 'Tapkeshwar Temple',
      galleryQueries: [
        'Tapkeshwar cave temple Dehradun Shiva',
        'natural cave temple river Dehradun Uttarakhand',
        'water dripping on Shiva lingam natural cavern',
        'river stream flowing forest cave temple Dehradun',
        'Shivalik foothills forest river temple Uttarakhand'
      ],
      galleryFallbacks: [
        'ancient cave shrine India nature forest',
        'sacred natural cavern water droplets shrine',
        'Dehradun river valley scenic forest'
      ],
      galleryAlts: [
        'Natural limestone cave shrine of Tapkeshwar Mahadev where water continuously drips',
        'Sacred Shiva Lingam consecrated inside the natural rock cavern of Tapkeshwar',
        'Scenic seasonal stream flowing past the sacred Tapkeshwar Temple ghats',
        'Drona Cave meditation cavern surrounded by lush Shivalik forest hills',
        'Spiritual evening Aarti lamps reflecting in the pristine cave river waters'
      ],
      placeConfigs: {
        'Dehradun': {
          queries: ['Dehradun city valley panoramic hills', 'Doon valley scenic city mountains view'],
          fallbacks: ['Dehradun foothills view green mountains', 'scenic hill valley town India']
        },
        'Indian Council of Forestry Research and Education': {
          queries: ['Forest Research Institute Dehradun colonial facade', 'FRI Dehradun grand Greco Roman brick architecture'],
          fallbacks: ['grand colonial institutional building garden', 'historic red brick academic palace lawns']
        },
        'Cambrian Hall': {
          queries: ['heritage boarding school campus mountains India', 'classic colonial school building garden Dehradun'],
          fallbacks: ['historic brick educational academy clock tower', 'school grounds greenery mountains backdrop']
        },
        'Doon Valley': {
          queries: ['Doon Valley scenic green hills tea garden', 'scenic mountain valley clouds Uttarakhand'],
          fallbacks: ['lush green rolling hills misty mountains', 'panoramic tea estate Doon valley']
        },
        'Lok Bhavan, Dehradun': {
          queries: ['Raj Bhavan Dehradun colonial governor house', 'grand colonial government mansion lawns Dehradun'],
          fallbacks: ['stately colonial mansion architecture gardens', 'majestic administrative estate mountain backdrop']
        },
        'National Hydrographic Office': {
          queries: ['marine survey institute building nautical landmark', 'modern government administrative campus India'],
          fallbacks: ['stately public building gardens India', 'clean institutional building facade trees']
        },
        "St Joseph's Academy, Dehradun": {
          queries: ['St Josephs Academy Dehradun heritage school building', 'colonial stone school facade sports field Dehradun'],
          fallbacks: ['historic catholic convent school facade', 'academic heritage building clock tower India']
        },
        'Uttara Museum of Contemporary Art': {
          queries: ['contemporary art museum gallery exhibition hall', 'modern art museum sculpture gallery indoor'],
          fallbacks: ['art gallery museum interior paintings display', 'cultural museum modern architecture India']
        }
      }
    }
  },
  {
    filename: 'siddhesvara-temple.json',
    config: {
      title: 'Siddhesvara Temple',
      galleryQueries: [
        'Western Chalukya soapstone temple Haveri',
        'Siddheshwara temple Haveri lathe turned pillars',
        'ancient soapstone carved Hindu temple Karnataka',
        'staggered square vimana Chalukya architecture',
        'intricate stone ceiling carvings Chalukya temple'
      ],
      galleryFallbacks: [
        'Hoysala Chalukya stone relief carvings',
        'lathe turned polished stone temple pillars',
        'ancient medieval stone temple Karnataka'
      ],
      galleryAlts: [
        'Intricate 12th-century Western Chalukya soapstone carvings at Siddhesvara Temple',
        'Staggered-square hall and lathe-turned polished stone pillars of Haveri temple',
        'Exquisitely carved doorway and Gajalakshmi lintel relief at Siddhesvara Temple',
        'Historic soapstone vimana tower showcasing classical Chalukyan architecture',
        'Panoramic view of the sacred Siddhesvara temple sanctum and manicured gardens'
      ],
      placeConfigs: {
        'Haveri': {
          queries: ['Haveri town Karnataka heritage temple', 'Karnataka heritage historic countryside Haveri'],
          fallbacks: ['peaceful Karnataka town temple architecture', 'scenic agricultural landscape Karnataka']
        },
        'Aladakatti': {
          queries: ['rural Karnataka green fields village', 'Deccan plateau green rural farming landscape'],
          fallbacks: ['sunflower fields agricultural land Karnataka', 'rustic rural Karnataka countryside']
        },
        'Agadi, Haveri': {
          queries: ['organic rural farm village Karnataka', 'traditional village hut green farm Karnataka'],
          fallbacks: ['peaceful village greenery coconut groves', 'rustic farmland rural path Karnataka']
        },
        'Devagiri, Karnataka': {
          queries: ['historic hilltop temple ruins Karnataka', 'ancient stone temple on hill Karnataka'],
          fallbacks: ['scenic rocky hill fort temple vista', 'Deccan boulder hill landscape']
        },
        'Anandavana': {
          queries: ['serene ashram forest garden retreat India', 'peaceful meditation hermitage grove trees'],
          fallbacks: ['spiritual ashram peaceful garden walkway', 'tranquil botanical grove retreat']
        },
        'Devihosur': {
          queries: ['rural village temple Karnataka ancient', 'ancient stone village shrine Karnataka'],
          fallbacks: ['countryside temple courtyard stone', 'rural village peaceful morning Karnataka']
        }
      }
    }
  },
  {
    filename: 'panchakuta-basadi-kambadahalli.json',
    config: {
      title: 'Panchakuta Basadi, Kambadahalli',
      galleryQueries: [
        'Panchakuta Basadi Kambadahalli Jain granite temple',
        'Western Ganga dynasty granite temple Mandya',
        'monolithic Brahmadeva pillar Kambadahalli',
        'ancient Jain tirthankara stone carving Karnataka',
        'Dravidian granite five shrines basadi Karnataka'
      ],
      galleryFallbacks: [
        'ancient Jain rock cut temple granite India',
        'monolithic stone pillar manastambha Jain',
        'early medieval granite stone temple Dravidian'
      ],
      galleryAlts: [
        'Panchakuta Basadi ancient 9th-century granite five-shrine Jain temple complex',
        'Majestic monolithic Brahmadeva Manastambha stone pillar at Kambadahalli',
        'Serene granite carved Tirthankara icons inside the historic sanctum',
        'Classical Western Ganga dynasty granite Dravidian vimana architecture',
        'Courtyard view of the sacred Kambadahalli heritage pilgrimage site'
      ],
      placeConfigs: {
        'Addihalli, Mandya': {
          queries: ['Mandya district green sugarcane fields Karnataka', 'peaceful rural farmland Mandya landscape'],
          fallbacks: ['green paddy fields rural Karnataka', 'scenic canal countryside Karnataka']
        },
        'Bindiganavile': {
          queries: ['historic village temple pond Karnataka', 'ancient stone temple gopuram rural Karnataka'],
          fallbacks: ['traditional temple lake countryside Karnataka', 'rustic Karnataka village landscape']
        }
      }
    }
  },
  {
    filename: 'someshwara-temple-marathahalli.json',
    config: {
      title: 'Someshwara Temple, Marathahalli',
      galleryQueries: [
        'ancient Chola stone temple Bangalore',
        'Someshwara temple stone pillars shiva',
        'historic granite temple sanctum Bangalore heritage',
        'ancient Hindu temple stone carvings Karnataka',
        'sacred temple kalyani water tank Bangalore'
      ],
      galleryFallbacks: [
        'ancient South Indian stone temple courtyard',
        'carved granite stone temple gopuram',
        'sacred temple lamps evening Bangalore'
      ],
      galleryAlts: [
        'Chola era granite stone pillars and outer mandapam of Someshwara Temple',
        'Sacred Shiva Lingam sanctum and intricately carved granite doorframes',
        'Historic temple courtyard with ancient Navagraha shrines and stone bells',
        'Venerable sacred peepal tree and brass Deepasthambham within temple grounds',
        'Spiritual morning serenity at the heritage Someshwara Temple in Marathahalli'
      ],
      placeConfigs: {
        'Kodibeesanahalli metro station': {
          queries: ['modern metro viaduct station Bangalore', 'elevated metro train track modern city India'],
          fallbacks: ['modern urban transit train station platform', 'metro rail viaduct pillars urban street']
        },
        'Marathahalli': {
          queries: ['Marathahalli outer ring road Bangalore traffic modern', 'Bangalore tech corridor modern glass buildings street'],
          fallbacks: ['modern urban commercial avenue Bangalore', 'busy tech park boulevard Bangalore']
        },
        'Marathahalli metro station': {
          queries: ['modern elevated metro station exterior glass steel', 'Namma Metro elevated transit station Bangalore'],
          fallbacks: ['modern public rapid transit rail terminal', 'elevated metro train crossing bridge']
        },
        'ISRO metro station': {
          queries: ['futuristic modern metro train station exterior', 'modern public transit rail network India'],
          fallbacks: ['sleek elevated metro railway track sunrise', 'modern urban city transit station glass']
        },
        'Kadubeesanahalli metro station': {
          queries: ['Bangalore outer ring road IT corridor metro', 'modern elevated railway station bridge sunset'],
          fallbacks: ['modern urban highway metro viaduct', 'elevated urban rail transit infrastructure']
        },
        'Vibhutipura Lake': {
          queries: ['Vibhutipura Lake Bangalore peaceful water walk', 'serene urban lake Bangalore walking track trees'],
          fallbacks: ['tranquil city lake water reflections trees', 'peaceful lake shore nature park morning']
        },
        'Doddanekundi metro station': {
          queries: ['modern elevated metro line urban street lights dusk', 'city metro rail viaduct bridge modern architecture'],
          fallbacks: ['modern rapid transport viaduct evening', 'modern elevated transit platform urban']
        },
        'HAL Heritage Centre and Aerospace Museum': {
          queries: ['fighter aircraft outdoors museum exhibition HAL', 'aerospace museum vintage airplanes display Bangalore'],
          fallbacks: ['historic jet airplane outdoor aviation museum', 'vintage helicopter aircraft display museum']
        }
      }
    }
  },
  {
    filename: 'sakshinatheswarar-temple-thiruppurambiyam.json',
    config: {
      title: 'Sakshinatheswarar Temple, Thiruppurambiyam',
      galleryQueries: [
        'ancient Chola dynasty stone temple gopuram',
        'Thiruppurambiyam temple stone carvings Thanjavur',
        'ancient granite temple vimana Chola architecture',
        'sacred temple tank teppakulam Tamil Nadu temple',
        'intricate stone relief carvings Hindu temple Chola'
      ],
      galleryFallbacks: [
        'grand Dravidian temple stone gopuram blue sky',
        'ancient granite temple sanctum Tamil Nadu',
        'sacred Chola heritage temple hall pillars'
      ],
      galleryAlts: [
        'Magnificent Dravidian stone gopuram of historic Sakshinatheswarar Temple',
        'Historic Chola granite vimana tower dating back to the Battle of Thiruppurambiyam',
        'Sacred Pralayam Katha Vinayakar shrine consecrated within the inner precinct',
        'Venerated temple teppakulam tank and ancient pillared circumambulatory path',
        'Ancient stone epigraphs and inscriptions recording 9th-century Chola history'
      ],
      placeConfigs: {
        'Masilamaniswara Temple, Thiruvaduthurai': {
          queries: ['ancient stone temple gopuram Thiruvaduthurai Chola', 'Dravidian stone temple hall pillars Tamil Nadu'],
          fallbacks: ['grand ancient Hindu temple sanctum granite', 'carved stone temple tower blue sky']
        },
        'Pasupatheeswarar Temple, Aavoor': {
          queries: ['ancient granite stone shiva temple Tamil Nadu', 'carved granite temple entrance gopuram'],
          fallbacks: ['traditional South Indian stone temple vimana', 'ancient Hindu stone sanctum courtyard']
        },
        'Vellanjar': {
          queries: ['Cauvery delta fertile green paddy fields Tamil Nadu', 'scenic agricultural landscape palm trees Tamil Nadu'],
          fallbacks: ['lush green paddy fields canal water', 'peaceful rural Tamil Nadu village landscape']
        },
        'Annavasal, Tiruvarur': {
          queries: ['peaceful temple village tank Tamil Nadu', 'rural heritage village landscape Thanjavur delta'],
          fallbacks: ['scenic rural village road coconut trees', 'traditional Tamil Nadu village temple street']
        },
        'Annavasal, Pudukkottai': {
          queries: ['Pudukkottai rocky terrain ancient stone temple', 'rock cut heritage shrine Pudukkottai landscape'],
          fallbacks: ['ancient granite boulder temple landscape', 'historic rural stone shrine South India']
        },
        'Meivazhi Salai': {
          queries: ['peaceful ashram garden spiritual retreat South India', 'sacred community ashram white architecture trees'],
          fallbacks: ['tranquil spiritual meditation grounds garden', 'peaceful rural hermitage pathway greenery']
        },
        'Sittanavasal': {
          queries: ['Sittanavasal rock cut cave temple Jain carvings', 'ancient rock cut cave temple Pudukkottai granite'],
          fallbacks: ['historic rock cut monolithic cavern facade', 'ancient Indian rock cut cave reliefs']
        },
        'Iluppur': {
          queries: ['peaceful heritage town Tamil Nadu countryside', 'rural agricultural town greenery Tamil Nadu'],
          fallbacks: ['traditional South Indian village pond', 'scenic rural landscape palms fields']
        }
      }
    }
  }
];

// SQUAD 3 CONFIGURATIONS: Nature, Sanctuaries & Waterfalls
const squad3Nature = [
  {
    filename: 'thirparappu-waterfalls.json',
    config: {
      title: 'Thirparappu Waterfalls',
      galleryQueries: [
        'Thirparappu waterfalls Kanyakumari cascade',
        'Kodayar river waterfall Western Ghats Tamil Nadu',
        'scenic multi tiered waterfall tropical forest rocks',
        'wide gushing waterfall river cascade lush greenery',
        'monsoon waterfalls South India nature tourism'
      ],
      galleryFallbacks: [
        'majestic wide waterfall river rocks jungle',
        'tropical river cascade green mountains',
        'lush rainforest waterfall flowing rocks'
      ],
      galleryAlts: [
        'Majestic 50-foot cascading Thirparappu Waterfalls on the Kodayar River',
        'Wide panoramic view of Thirparappu falls gushing over rocky basalt ledge',
        'Tranquil boating pool and mist rising above Thirparappu waterfall basin',
        'Ancient Mahadevar Temple situated right beside the waterfall cascades',
        'Lush tropical Western Ghats greenery flanking the roaring monsoon falls'
      ],
      placeConfigs: {
        'Thirparappu': {
          queries: ['scenic river waterfalls park Tamil Nadu', 'tropical green forest riverbank walkway'],
          fallbacks: ['peaceful river park recreation greenery', 'scenic waterfall viewpoint tourist park']
        },
        'Arumanai': {
          queries: ['rubber plantation hills Kanyakumari greenery', 'Western Ghats rubber estate road Tamil Nadu'],
          fallbacks: ['dense green tropical tree plantation', 'winding road through lush green hills']
        },
        'Thiruvarambu': {
          queries: ['rural village lush coconut palm groves Tamil Nadu', 'tranquil agricultural valley hills Kanyakumari'],
          fallbacks: ['emerald green banana and palm plantations', 'peaceful South Indian countryside vista']
        },
        'Kulasekaram': {
          queries: ['Western Ghats foothills green estate river', 'scenic town hills pepper coffee rubber estate'],
          fallbacks: ['misty hills tropical foliage river stream', 'tranquil tropical valley view']
        },
        'Kadayal': {
          queries: ['peaceful village lake foothills Western Ghats', 'scenic rural lake reflections green hills'],
          fallbacks: ['tropical freshwater lake palm trees', 'peaceful countryside water body sunset']
        },
        'Kodayar River': {
          queries: ['Kodayar river flowing granite boulders forest', 'clear mountain river stream rapids lush jungle'],
          fallbacks: ['pristine river rapids green tropical forest', 'freshwater river flowing stones sunlight']
        },
        'Vaikunda Chella Pathi': {
          queries: ['traditional South Indian stone shrine courtyard', 'sacred spiritual path temple greenery Tamil Nadu'],
          fallbacks: ['peaceful spiritual sanctum courtyard', 'traditional temple entrance arch trees']
        },
        'Puthenchanthai': {
          queries: ['traditional market street South India countryside', 'bustling rural town avenue palm trees'],
          fallbacks: ['peaceful rural South Indian marketplace', 'local street market tropical town']
        }
      }
    }
  },
  {
    filename: 'sessa-orchid-sanctuary.json',
    config: {
      title: 'Sessa Orchid Sanctuary',
      galleryQueries: [
        'wild Himalayan orchids blooming rainforest',
        'Dendrobium orchid flower tropical cloud forest',
        'Paphiopedilum lady slipper orchid wild flower',
        'Arunachal Pradesh misty subtropical rainforest canopy',
        'pristine mountain rainforest river valley Arunachal'
      ],
      galleryFallbacks: [
        'vibrant exotic orchid flowers blooming wild',
        'misty tropical cloud forest canopy moss trees',
        'Himalayan mountain rainforest lush green'
      ],
      galleryAlts: [
        'Exotic wild Himalayan orchids in full bloom along the Sessa forest trail',
        'Rare Paphiopedilum ladys slipper orchid flourishing in native habitat',
        'Misty subtropical rainforest canopy of the Sessa Orchid Sanctuary',
        'Vibrant Dendrobium blooms clinging to moss-covered jungle trees',
        'Breathtaking panoramic view of the lush Kameng river gorge in Arunachal'
      ],
      placeConfigs: {
        'Singchung': {
          queries: ['Singchung Bugun village hills Arunachal Pradesh', 'Himalayan mountain village terrace misty hills'],
          fallbacks: ['scenic Eastern Himalayan valley village', 'peaceful mountain community green hills']
        }
      }
    }
  },
  {
    filename: 'tungabhadra-otter-conservation-reserve.json',
    config: {
      title: 'Tungabhadra Otter Conservation Reserve',
      galleryQueries: [
        'smooth coated otter family riverbank rocks',
        'wild otters playing in fresh river water',
        'Tungabhadra river boulders rapids Hampi landscape',
        'granite boulder river landscape sunset Hampi Karnataka',
        'pristine rocky river sanctuary wildlife habitat'
      ],
      galleryFallbacks: [
        'river otters swimming natural habitat',
        'rocky riverbed rapids boulders sunset',
        'scenic river winding through giant granite boulders'
      ],
      galleryAlts: [
        'Family of smooth-coated otters basking on Tungabhadra granite boulders',
        'Playful otters swimming through the clear rapids of the Tungabhadra River',
        'Rugged granite boulder landscape and riverine habitat around Hampi',
        'Spectacular sunrise reflecting across the tranquil Tungabhadra waters',
        'Protected biodiversity corridor of the Tungabhadra Otter Reserve'
      ],
      placeConfigs: {
        'Anegundi': {
          queries: ['Anegundi historic village Kishkindha boulder hills', 'ancient stone gateway Anegundi Hampi rural'],
          fallbacks: ['granite boulder hills paddy fields Hampi', 'ancient rural heritage village Karnataka']
        },
        'Pampa Sarovar': {
          queries: ['Pampa Sarovar sacred lotus pond Hampi', 'sacred lotus pond boulder hills Kishkindha'],
          fallbacks: ['tranquil temple pond blooming pink lotuses', 'serene water lily pool ancient shrine']
        },
        'Hampi (town)': {
          queries: ['Hampi bazaar street ancient stone pavilions', 'historic stone colonnade Hampi Virupaksha bazaar'],
          fallbacks: ['ancient Vijayanagara ruined stone pavilions', 'historic bazaar street boulder hill backdrop']
        },
        'Hampi': {
          queries: ['Hampi boulder landscape ruins UNESCO World Heritage', 'panoramic view of Hampi ruined monuments sunset'],
          fallbacks: ['ancient granite monuments boulder plateau', 'surreal granite boulder terrain ancient empire']
        },
        'Zenana Mahal': {
          queries: ['Zenana enclosure ruined palace basement Hampi', 'ancient watchtower Zenana enclosure Indo Islamic Hampi'],
          fallbacks: ['heritage palace garden enclosure watchtower', 'Vijayanagara royal palace ruins lawn']
        },
        'Lotus Mahal': {
          queries: ['Lotus Mahal Hampi Indo Islamic architecture arches', 'Lotus Mahal symmetrical palace arches lawns'],
          fallbacks: ['ornate cusped arches historic palace pavilion', 'Indo Saracenic two storey stone palace Hampi']
        },
        'Vijayanagara': {
          queries: ['Vijayanagara empire monumental stone chariot Hampi', 'grand royal center public bath pushkarani Hampi'],
          fallbacks: ['ancient royal capital stone monuments India', 'monumental stepped water tank stone ruins']
        },
        'Virupaksha Temple, Hampi': {
          queries: ['Virupaksha Temple gopuram tower Hampi sky', 'sacred Virupaksha temple sanctum courtyard Hampi'],
          fallbacks: ['grand Hindu temple gopuram boulder hills', 'historic Vijayanagara main pilgrimage temple']
        }
      }
    }
  },
  {
    filename: 'nanda-devi-national-park.json',
    config: {
      title: 'Nanda Devi National Park',
      galleryQueries: [
        'Nanda Devi peak snow mountain summit Himalayas',
        'Nanda Devi sanctuary alpine meadows glaciated peaks',
        'Rishiganga gorge high altitude Himalayan wilderness',
        'Trisul peak snow mountains panoramic view Chamoli',
        'UNESCO World Heritage Nanda Devi biosphere reserve'
      ],
      galleryFallbacks: [
        'majestic high Himalayan snow peak sunrise',
        'alpine meadow wildflowers snow mountains backdrop',
        'glacier valley rugged high altitude Himalayas'
      ],
      galleryAlts: [
        'Spectacular towering summit of Nanda Devi rising against clear azure skies',
        'Pristine alpine meadows and glaciated wilderness of Nanda Devi Sanctuary',
        'Dramatic rugged cliffs of the inaccessible Rishiganga gorge',
        'Panoramic view of snow-capped Trisul and Dunagiri mountain peaks',
        'High-altitude Himalayan biodiversity and pristine glacial moraines'
      ],
      placeConfigs: {
        'Rishi Kot': {
          queries: ['rugged sharp snow peak mountain Himalayas', 'dramatic granite mountain spire snow Chamoli'],
          fallbacks: ['pyramid shaped snow mountain peak sunrise', 'majestic alpine horn peak high altitude']
        },
        'Bethartoli': {
          queries: ['glaciated Himalayan mountain ridge Bethartoli', 'hanging glaciers snow mountain peak Garhwal'],
          fallbacks: ['snow covered knife edge mountain ridge', 'dramatic alpine glacier mountain panorama']
        },
        'Rishiganga': {
          queries: ['roaring glacial river canyon Himalayas', 'rushing mountain torrent rocky gorge snow mountains'],
          fallbacks: ['fast flowing turquoise glacier river rocks', 'mountain gorge river rapids snow peaks']
        },
        'Bethartoli South': {
          queries: ['massive snow covered mountain face cliff', 'alpine peak clouds swirling Himalayan summit'],
          fallbacks: ['towering snow peak dramatic weather', 'pure white snow mountain ridge blue sky']
        },
        '2021 Uttarakhand flood': {
          queries: ['Joshimath mountain valley river bridge Uttarakhand', 'Raini village Rishiganga valley mountain gorge'],
          fallbacks: ['deep Himalayan river gorge rocky valley', 'mountain valley suspension bridge glacier river']
        },
        'Devistan II': {
          queries: ['high altitude alpine snow summit Chamoli', 'pristine mountain snow slope mountaineering peak'],
          fallbacks: ['untouched mountain snowfield alpine vista', 'panoramic high Himalayan mountain ridge']
        },
        'Devistan I': {
          queries: ['magnificent Himalayan mountain panorama dawn golden light', 'sharp snow peak glowing morning sunrise Himalayas'],
          fallbacks: ['first morning sun rays on snow peak', 'golden sunrise on Himalayan mountain crest']
        }
      }
    }
  },
  {
    filename: 'bibhutibhushan-wildlife-sanctuary.json',
    config: {
      title: 'Bibhutibhushan Wildlife Sanctuary',
      galleryQueries: [
        'chital spotted deer herd deciduous forest',
        'Ichamati river serene green banks Bengal',
        'Parmadan forest tall sal trees canopy',
        'peaceful wildlife sanctuary woodland trail India',
        'spotted deer grazing in green forest clearing'
      ],
      galleryFallbacks: [
        'tranquil river flowing through green forest Bengal',
        'lush deciduous forest sunbeams green trees',
        'peaceful nature reserve forest pathway'
      ],
      galleryAlts: [
        'Herds of spotted deer grazing peacefully in the Parmadan forest clearing',
        'Serene waters of the Ichamati River bordering the sanctuary woodland',
        'Sunlight filtering through the dense canopy of tall sal and teak trees',
        'Nature walking trail through the heart of Bibhutibhushan Sanctuary',
        'Rich biodiversity and tranquil birdlife along the forested riverbanks'
      ],
      placeConfigs: {
        'Naldugari': {
          queries: ['peaceful rural forest village Bengal greenery', 'dense village woodland bamboo groves Bengal'],
          fallbacks: ['rural riverside trail green trees Bengal', 'peaceful agricultural village woodland']
        },
        'Kazirber Union': {
          queries: ['green rural river basin landscape Bengal', 'Ichamati river peaceful village bank canoe'],
          fallbacks: ['tranquil river water flowing greenery Bengal', 'rural countryside waterway trees reflections']
        },
        'Duttapulia': {
          queries: ['scenic Bengal countryside road mango groves', 'rural Bengal village landscape greenery sunlight'],
          fallbacks: ['peaceful village path lush tropical foliage', 'green rural countryside landscape Bengal']
        }
      }
    }
  },
  {
    filename: 'mogalrajapuram-caves.json',
    config: {
      title: 'Mogalrajapuram caves',
      galleryQueries: [
        'ancient rock cut cave temple facade pillars India',
        '5th century rock cut cave sanctum carvings',
        'ancient rock cut cave architecture Vijayawada',
        'carved stone pillars cave temple hill Andhra',
        'historic rock cut sanctuary facade sandstone'
      ],
      galleryFallbacks: [
        'ancient Indian rock cut cave monastery facade',
        'intricate stone carved deities rock cut shrine',
        'historic rock cut architecture hill slope'
      ],
      galleryAlts: [
        'Ancient 5th-century rock-cut cave facade of Mogalrajapuram Caves',
        'Intricately carved stone pillars and sanctum entrance cut into solid rock',
        'Historic Ardhanarishvara rock relief within the cave sanctum',
        'Hilltop vantage point overlooking Vijayawada from the cave terraces',
        'Preserved Eastern Chalukya rock-cut heritage monument in Mogalrajapuram'
      ],
      placeConfigs: {
        'Vijayawada Urban mandal': {
          queries: ['Vijayawada city skyline modern buildings sunset', 'Prakasam Barrage Krishna river Vijayawada city'],
          fallbacks: ['modern Indian city riverside panorama', 'city lights Krishna river bridge evening']
        },
        'Andhra Pradesh Capital Region': {
          queries: ['Amaravati capital region modern riverfront landscape', 'Krishna river broad fertile floodplains Andhra'],
          fallbacks: ['scenic river valley agricultural landscape Andhra', 'modern riverfront expressway development']
        },
        'Vijayawada West mandal': {
          queries: ['Kanaka Durga temple Indrakeeladri hill Vijayawada', 'Indrakeeladri hill Krishna river view Vijayawada'],
          fallbacks: ['sacred hill temple overlooking river city', 'historic riverside city temple hill']
        },
        'Mogalrajapuram': {
          queries: ['Vijayawada rocky hill residential neighborhood', 'rocky hillock city residential avenue Vijayawada'],
          fallbacks: ['urban residential green streets India', 'peaceful city neighborhood hills backdrop']
        },
        'One Town, Vijayawada': {
          queries: ['historic heritage bazaar street Vijayawada', 'bustling traditional Indian market commercial street'],
          fallbacks: ['vibrant traditional Indian shopping street', 'historic urban trade avenue South India']
        },
        'Bhavanipuram': {
          queries: ['Krishna river bank promenade greenery Vijayawada', 'riverside park water sunset Vijayawada'],
          fallbacks: ['peaceful city riverfront park promenade', 'scenic urban riverbank walkway trees']
        },
        'Indira Gandhi Stadium (Vijayawada)': {
          queries: ['modern sports stadium athletic track floodlights India', 'cricket athletic stadium green outfield pavilion'],
          fallbacks: ['sports arena open air stadium seating', 'large cricket stadium green field stands']
        },
        'Benz Circle Flyover': {
          queries: ['modern city elevated highway flyover lights dusk', 'Vijayawada Benz Circle flyover illuminated evening'],
          fallbacks: ['sleek multi lane elevated highway city night', 'modern urban transportation flyover illuminated']
        }
      }
    }
  }
];

// SQUAD 4 CONFIGURATIONS: Metros & Urban Districts
const squad4Metros = [
  {
    filename: 'noida.json',
    config: {
      title: 'Noida & Greater Noida',
      galleryQueries: [
        'Noida modern skyline expressway glass towers',
        'Noida Greater Noida expressway modern city sunset',
        'Noida corporate tech park modern architecture',
        'modern planned city skyline NCR India',
        'Noida city night lights modern highways'
      ],
      galleryFallbacks: [
        'modern corporate glass skyscrapers dusk',
        'futuristic planned urban city skyline India',
        'sleek multi lane expressway modern metropolis'
      ],
      galleryAlts: [
        'Modern high-rise corporate towers and Noida-Greater Noida Expressway skyline',
        'Sleek contemporary glass facades of corporate tech parks in Sector 62',
        'Lush green median and landscaped parks along the Noida wide boulevards',
        'Vibrant evening illumination of commercial districts in Sector 18 Noida',
        'Panoramic view of Greater Noida planned urban infrastructure at sunset'
      ],
      placeConfigs: {
        'Okhla Bird Sanctuary': {
          queries: ['Okhla Bird Sanctuary wetland migratory birds', 'Yamuna river wetlands water birds sunset Delhi NCR'],
          fallbacks: ['peaceful wetland water lake migratory cranes', 'serene urban wildlife sanctuary lake reedbeds']
        },
        'DLF Mall of India': {
          queries: ['DLF Mall of India Noida grand modern facade', 'modern luxury shopping mall exterior plaza Noida'],
          fallbacks: ['contemporary luxury shopping mall glass atrium', 'modern premier shopping mall grand atrium interior']
        },
        'Buddh International Circuit': {
          queries: ['Buddh International Circuit Formula 1 grandstand track', 'race track start finish straight racing circuit India'],
          fallbacks: ['modern motorsport racing circuit grandstand', 'Formula 1 racing track tarmac asphalt corners']
        },
        'Botanic Garden of Indian Republic': {
          queries: ['botanic garden lush green trees greenhouse park', 'serene botanical garden walking trails flowers trees'],
          fallbacks: ['landscaped botanical arboretum lush greenery', 'peaceful botanical garden lake walking path']
        }
      }
    }
  },
  {
    filename: 'gurugram.json',
    config: {
      title: 'Gurugram',
      galleryQueries: [
        'Gurugram DLF Cyber City skyline modern skyscrapers',
        'CyberHub Gurgaon modern dining nightlife plaza',
        'Gurgaon millennium city corporate glass towers dusk',
        'Gurugram Rapid Metro modern elevated transit',
        'luxurious corporate skyline Gurugram sunset'
      ],
      galleryFallbacks: [
        'modern metropolitan glass corporate architecture',
        'bustling outdoor urban dining restaurant promenade',
        'futuristic city skyline highway lights night'
      ],
      galleryAlts: [
        'Iconic glass skyscrapers of DLF Cyber City towering over Gurugram',
        'Vibrant evening dining promenade and bustling terraces at DLF CyberHub',
        'Sleek modern elevated Rapid Metro navigating through the Cyber City skyline',
        'Striking contemporary architecture of corporate headquarters on Golf Course Road',
        'Panoramic sunset vista of the Millennium City glistening glass towers'
      ],
      placeConfigs: {
        'DLF CyberHub': {
          queries: ['DLF CyberHub Gurgaon outdoor dining cafes modern', 'CyberHub plaza corporate dining promenade lights'],
          fallbacks: ['vibrant modern city dining plaza night', 'modern open air restaurant terrace urban']
        },
        'Sultanpur National Park': {
          queries: ['Sultanpur bird sanctuary migratory birds lake', 'painted storks wetlands Sultanpur National Park'],
          fallbacks: ['peaceful wetland lake flock of migratory birds', 'serene freshwater lake waterbirds sunrise']
        },
        'Kingdom of Dreams': {
          queries: ['grand palace auditorium royal theatre architecture', 'ornate Indian cultural palace illuminated night'],
          fallbacks: ['grand illuminated cultural amphitheatre palace', 'majestic theatrical palace facade lights']
        },
        'Heritage Transport Museum': {
          queries: ['vintage classic car museum showroom display', 'historic vintage transport museum automobiles India'],
          fallbacks: ['classic retro cars museum exhibition hall', 'vintage locomotive automobile museum display']
        },
        'Sheetla Mata Mandir': {
          queries: ['grand Hindu temple white marble gopuram Haryana', 'historic Sheetla Mata temple pilgrims courtyard'],
          fallbacks: ['sacred Hindu temple complex courtyard lamps', 'majestic carved white marble temple facade']
        },
        'Aravali Biodiversity Park': {
          queries: ['Aravali Biodiversity Park Gurgaon walking trails nature', 'native ridge forest walking path Aravali hills'],
          fallbacks: ['serene nature trail walking path native trees', 'peaceful ridge park walking track morning']
        }
      }
    }
  }
];

async function runAllSquads() {
  console.log('Starting Master Remediation Run across all 19 priority destinations...\n');
  initGlobalCollisions();

  // 1. Run Squad 1: Forts
  console.log('\n======================================================');
  console.log('>>> EXECUTING AGENT SQUAD 1: HISTORICAL FORTS (4 Destinations)');
  console.log('======================================================');
  for (const item of squad1Forts) {
    await remediateDestination(item.filename, item.config);
  }

  // 2. Run Squad 2: Temples & Shrines
  console.log('\n======================================================');
  console.log('>>> EXECUTING AGENT SQUAD 2: SACRED TEMPLES & BASADIS (7 Destinations)');
  console.log('======================================================');
  for (const item of squad2Temples) {
    await remediateDestination(item.filename, item.config);
  }

  // 3. Run Squad 3: Nature & Waterfalls
  console.log('\n======================================================');
  console.log('>>> EXECUTING AGENT SQUAD 3: NATURE & WATERFALLS (6 Destinations)');
  console.log('======================================================');
  for (const item of squad3Nature) {
    await remediateDestination(item.filename, item.config);
  }

  // 4. Run Squad 4: Metros & Urban
  console.log('\n======================================================');
  console.log('>>> EXECUTING AGENT SQUAD 4: METROS & URBAN DISTRICTS (2 Destinations)');
  console.log('======================================================');
  for (const item of squad4Metros) {
    await remediateDestination(item.filename, item.config);
  }

  console.log('\n======================================================');
  console.log('Master Remediation Completed. Now updating indexes...');
  console.log('======================================================');

  // Rebuild index.json & home-manifest.json
  const { execSync } = require('child_process');
  console.log('Rebuilding data/destinations/index.json & home-manifest.json...');
  execSync('node scripts/build-json-data.js', { stdio: 'inherit' });
  execSync('node scripts/build-home-manifest.js', { stdio: 'inherit' });
  console.log('✔ All indexes successfully synchronized!');
}

runAllSquads().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
