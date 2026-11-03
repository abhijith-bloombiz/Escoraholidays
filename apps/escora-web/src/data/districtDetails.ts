// District metadata & destination associations
export interface DistrictInfo {
  name: string;
  associatedDestId?: string;
  category: string;
  highlights: string;
}

export const DISTRICT_DETAILS: Record<string, DistrictInfo> = {
  Alappuzha: {
    name: "Alappuzha",
    associatedDestId: "alleppey",
    category: "Backwater Capital",
    highlights: "Vembanad Lake, Kettuvallam houseboats & Kuttanad paddy fields",
  },
  Ernakulam: {
    name: "Ernakulam (Kochi)",
    associatedDestId: "kochi",
    category: "Heritage & Commerce",
    highlights: "Fort Kochi colonial streets, Chinese fishing nets & Mattancherry",
  },
  Idukki: {
    name: "Idukki",
    associatedDestId: "munnar",
    category: "Highland Spice & Tea Country",
    highlights: "Munnar tea gardens, Anamudi peak & Periyar wildlife in Thekkady",
  },
  Kannur: {
    name: "Kannur",
    category: "Theyyam & Loom Coast",
    highlights: "Sacred Theyyam rituals, Muzhappilangad drive-in beach & St. Angelo Fort",
  },
  Kasaragod: {
    name: "Kasaragod",
    category: "Forts & Rivers",
    highlights: "Bekal coastal fortress, Ranipuram hill station & uncrowded shores",
  },
  Kollam: {
    name: "Kollam",
    category: "Ashtamudi Estuary",
    highlights: "Gateway to the backwaters, historic cashew trade & Munroe Island",
  },
  Kottayam: {
    name: "Kottayam",
    associatedDestId: "alleppey",
    category: "Lakes & Letters",
    highlights: "Kumarakom bird sanctuary, rubber hills & backwater canals",
  },
  Kozhikode: {
    name: "Kozhikode",
    associatedDestId: "calicut",
    category: "Historic Spice Port",
    highlights: "Vasco da Gama's landing, Malabar culinary heritage & Beypore shipyards",
  },
  Malappuram: {
    name: "Malappuram",
    category: "Cultural Heartland",
    highlights: "Kottakkal Arya Vaidya Sala, teak plantations & rolling hills",
  },
  Palakkad: {
    name: "Palakkad",
    category: "Gateway of the Ghats",
    highlights: "Palakkad Gap, Silent Valley National Park & historic granite fort",
  },
  Pathanamthitta: {
    name: "Pathanamthitta",
    category: "Pilgrimage & Forest",
    highlights: "Gavi ecotourism, Sabarimala shrine & Perunthenaruvi falls",
  },
  Thiruvananthapuram: {
    name: "Thiruvananthapuram",
    associatedDestId: "trivandrum",
    category: "Royal Capital & Cliffs",
    highlights: "Varkala laterite cliffs, Kovalam lighthouse & Padmanabhaswamy Temple",
  },
  Thrissur: {
    name: "Thrissur",
    category: "Cultural Capital",
    highlights: "Thrissur Pooram elephant festival, Vadakkunnathan Temple & performing arts",
  },
  Wayanad: {
    name: "Wayanad",
    associatedDestId: "wayanad",
    category: "Highland Rainforest",
    highlights: "Edakkal prehistoric rock art, Chembra peak & misty rainforest stays",
  },
};
