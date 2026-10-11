import varkala from "@assets/escora/collections/varkala-cliffs.jpeg";
import wayanad from "@assets/escora/collections/wayanad-churam.jpeg";
import alleppey from "@assets/escora/collections/alleppey-backwaters.jpeg";
import kannur from "@assets/escora/collections/payyambalam-driving-beach.jpg";
import munnar from "@assets/escora/collections/munnar-tea-estate.jpeg";
import fortKochi from "@assets/escora/collections/fort-kochi-heritage.jpg";
import thekkady from "@assets/escora/collections/periyar-tiger-reserve.webp";
import kovalam from "@assets/escora/collections/kovalam-beach.jpeg";
import kumarakom from "@assets/escora/collections/kumarakom-bird-sanctuary.jpeg";
import bekal from "@assets/escora/collections/bekal-fort.jpeg";

/**
 * Plain, text-free photographs per destination, for layouts that crop
 * images to varied shapes (the V3 masonry gallery). The illustrated
 * DESTINATION_BADGES carry the place name baked into the artwork, which
 * portrait/landscape crops would cut off.
 */
export const DESTINATION_PHOTOS: Record<string, string> = {
  varkala,
  wayanad,
  alleppey,
  kannur,
  munnar,
  "fort-kochi": fortKochi,
  thekkady,
  kovalam,
  kumarakom,
  bekal,
};
