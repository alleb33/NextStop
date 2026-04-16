const normalizeCityKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();

const cityAttractions: Record<string, string[]> = {};

const registerCityAttractions = (
  names: string[],
  attractions: string[]
) => {
  for (const name of names) {
    cityAttractions[normalizeCityKey(name)] = attractions;
  }
};

const registerUsStateCapital = (
  city: string,
  stateAbbreviation: string,
  attractions: string[],
  aliases: string[] = []
) => {
  registerCityAttractions([city, `${city}, ${stateAbbreviation}`, ...aliases], attractions);
};

const registerUsCity = (
  city: string,
  stateAbbreviation: string,
  attractions: string[],
  aliases: string[] = []
) => {
  registerCityAttractions([city, `${city}, ${stateAbbreviation}`, ...aliases], attractions);
};

registerCityAttractions(["Atlanta", "Atlanta, GA", "ATL"], [
  "Georgia Aquarium",
  "World of Coca-Cola",
  "Atlanta Botanical Garden",
  "Piedmont Park",
  "Martin Luther King Jr. National Historical Park",
  "Fox Theatre",
  "High Museum of Art",
  "BeltLine Eastside Trail",
  "Zoo Atlanta",
]);

registerCityAttractions(["Charlotte", "Charlotte, NC", "CLT"], [
  "NASCAR Hall of Fame",
  "U.S. National Whitewater Center",
  "Freedom Park",
  "Mint Museum Uptown",
  "Discovery Place Science",
  "Billy Graham Library",
  "Romare Bearden Park",
  "Levine Museum of the New South",
  "Carowinds",
]);

registerUsCity("Birmingham", "AL", [
  "Birmingham Civil Rights Institute",
  "Railroad Park",
  "Vulcan Park and Museum",
  "Birmingham Museum of Art",
  "Sloss Furnaces",
  "McWane Science Center",
  "Red Mountain Park",
  "Pepper Place",
  "Rickwood Field",
]);

registerUsCity("Mobile", "AL", [
  "USS Alabama Battleship Memorial Park",
  "Bellingrath Gardens and Home",
  "Dauphin Street",
  "Mobile Carnival Museum",
  "History Museum of Mobile",
  "GulfQuest",
  "Bienville Square",
  "Mobile Botanical Gardens",
  "Fort Condé",
]);

registerUsCity("Anchorage", "AK", [
  "Tony Knowles Coastal Trail",
  "Alaska Wildlife Conservation Center",
  "Anchorage Museum",
  "Flattop Mountain",
  "Alaska Native Heritage Center",
  "Earthquake Park",
  "Chugach State Park",
  "Potter Marsh",
  "Alyeska Tram",
]);

registerUsCity("Fairbanks", "AK", [
  "Museum of the North",
  "Chena Hot Springs",
  "Pioneer Park",
  "Morris Thompson Cultural Center",
  "Riverboat Discovery",
  "Creamer's Field",
  "Fountainhead Antique Auto Museum",
  "Aurora Ice Museum",
  "Denali National Park",
]);

registerUsCity("Tucson", "AZ", [
  "Saguaro National Park",
  "Arizona-Sonora Desert Museum",
  "Sabino Canyon",
  "Mission San Xavier del Bac",
  "Pima Air and Space Museum",
  "Mount Lemmon Scenic Byway",
  "Tucson Botanical Gardens",
  "Fourth Avenue",
  "Old Tucson",
]);

registerUsCity("Sedona", "AZ", [
  "Cathedral Rock",
  "Chapel of the Holy Cross",
  "Bell Rock",
  "Airport Mesa",
  "Slide Rock State Park",
  "Tlaquepaque Arts & Shopping Village",
  "Red Rock Scenic Byway",
  "Devil's Bridge Trail",
  "Oak Creek Canyon",
]);

registerUsCity("Fayetteville", "AR", [
  "Dickson Street",
  "Botanical Garden of the Ozarks",
  "Mount Sequoyah",
  "Clinton House Museum",
  "Lake Fayetteville",
  "Fayetteville Ale Trail",
  "Walton Arts Center",
  "Wilson Park",
  "Razorback Greenway",
]);

registerUsCity("Hot Springs", "AR", [
  "Hot Springs National Park",
  "Bathhouse Row",
  "Garvan Woodland Gardens",
  "Oaklawn Racing Casino Resort",
  "Mountain Tower",
  "Lake Hamilton",
  "Gangster Museum of America",
  "Mid-America Science Museum",
  "Magic Springs Theme and Water Park",
]);

registerUsCity("San Jose", "CA", [
  "Winchester Mystery House",
  "Santana Row",
  "The Tech Interactive",
  "Municipal Rose Garden",
  "Rosicrucian Egyptian Museum",
  "Japantown",
  "Alum Rock Park",
  "SAP Center",
  "San Pedro Square Market",
]);

registerUsCity("Colorado Springs", "CO", [
  "Garden of the Gods",
  "Pikes Peak",
  "Cheyenne Mountain Zoo",
  "Seven Falls",
  "Manitou Incline",
  "Cave of the Winds",
  "U.S. Olympic & Paralympic Museum",
  "Red Rock Canyon Open Space",
  "Old Colorado City",
]);

registerUsCity("Boulder", "CO", [
  "Pearl Street Mall",
  "Chautauqua Park",
  "Flatirons Vista",
  "University of Colorado Boulder",
  "Boulder Creek Path",
  "Flagstaff Mountain",
  "Eldorado Canyon State Park",
  "Celestial Seasonings Tea Tour",
  "NCAR Mesa Lab",
]);

registerUsCity("New Haven", "CT", [
  "Yale University",
  "Yale University Art Gallery",
  "East Rock Park",
  "New Haven Green",
  "Peabody Museum",
  "Lighthouse Point Park",
  "Wooster Square",
  "Long Wharf Theatre",
  "Shubert Theatre",
]);

registerUsCity("Stamford", "CT", [
  "Stamford Museum and Nature Center",
  "Cove Island Park",
  "Mill River Park",
  "The Palace Theatre",
  "Harbor Point",
  "Bartlett Arboretum",
  "Chelsea Piers Connecticut",
  "Stamford Downtown",
  "Fort Stamford Park",
]);

registerUsCity("Wilmington", "DE", [
  "Nemours Estate",
  "Hagley Museum and Library",
  "Brandywine Park",
  "Delaware Art Museum",
  "Grand Opera House",
  "Riverfront Wilmington",
  "Winterthur Museum, Garden and Library",
  "Rockwood Park",
  "Blue Rocks Stadium",
]);

registerUsCity("Newark", "DE", [
  "University of Delaware",
  "White Clay Creek State Park",
  "Main Street Newark",
  "Glasgow Park",
  "Iron Hill Museum",
  "Middletown Odessa Trolley Square",
  "Bob Carpenter Center",
  "Newark Reservoir",
  "Delaware Welcome Center",
]);

registerUsCity("Augusta", "GA", [
  "Augusta Riverwalk",
  "Augusta National Golf Club",
  "Phinizy Swamp Nature Park",
  "Morris Museum of Art",
  "Augusta Canal Trail",
  "Sacred Heart Cultural Center",
  "Meadow Garden",
  "Broad Street",
  "Hopelands Gardens",
]);

registerUsCity("Athens", "GA", [
  "University of Georgia Arch",
  "State Botanical Garden of Georgia",
  "Sanford Stadium",
  "Georgia Museum of Art",
  "Downtown Athens",
  "Bear Hollow Zoo",
  "Sandy Creek Park",
  "Creature Comforts Brewery",
  "North Oconee River Greenway",
]);

registerUsCity("Hilo", "HI", [
  "Rainbow Falls",
  "Hawaii Volcanoes National Park",
  "Liliuokalani Gardens",
  "Akaka Falls State Park",
  "Panaewa Rainforest Zoo",
  "Richardson Ocean Park",
  "Downtown Hilo",
  "Mauna Kea Visitor Center",
  "Hilo Farmers Market",
]);

registerUsCity("Kailua", "HI", [
  "Lanikai Beach",
  "Kailua Beach Park",
  "Pillbox Hike",
  "Nu'uanu Pali Lookout",
  "Byodo-In Temple",
  "Kualoa Ranch",
  "Ho'omaluhia Botanical Garden",
  "Kailua Town",
  "Ka'iwa Ridge Trail",
]);

registerUsCity("Coeur d'Alene", "ID", [
  "Lake Coeur d'Alene",
  "Tubbs Hill",
  "Coeur d'Alene Resort",
  "McEuen Park",
  "Silverwood Theme Park",
  "Downtown Coeur d'Alene",
  "Higgens Point",
  "Mineral Ridge Trail",
  "North Idaho Centennial Trail",
]);

registerUsCity("Idaho Falls", "ID", [
  "Idaho Falls River Walk",
  "Museum of Idaho",
  "Japanese Friendship Garden",
  "Idaho Falls Zoo",
  "Hell's Half Acre",
  "Tautphaus Park",
  "Downtown Idaho Falls",
  "Snake River Greenbelt",
  "Yellowstone Bear World",
]);

registerUsCity("Peoria", "IL", [
  "Grandview Drive",
  "Peoria Riverfront Museum",
  "Luthy Botanical Garden",
  "Peoria Zoo",
  "Caterpillar Visitors Center",
  "Forest Park Nature Center",
  "Dozer Park",
  "Wildlife Prairie Park",
  "Northwoods Mall",
]);

registerUsCity("Fort Wayne", "IN", [
  "Fort Wayne Children's Zoo",
  "Parkview Field",
  "Foellinger-Freimann Botanical Conservatory",
  "Promenade Park",
  "The Landing",
  "Fort Wayne Museum of Art",
  "Science Central",
  "Headwaters Park",
  "Lakeside Park and Rose Garden",
]);

registerUsCity("South Bend", "IN", [
  "University of Notre Dame",
  "Studebaker National Museum",
  "Potawatomi Zoo",
  "East Race Waterway",
  "The History Museum",
  "Basilica of the Sacred Heart",
  "Howard Park",
  "Morris Performing Arts Center",
  "River Lights Plaza",
]);

registerUsCity("Cedar Rapids", "IA", [
  "Brucemore",
  "Czech Village",
  "NewBo City Market",
  "National Czech & Slovak Museum",
  "Indian Creek Nature Center",
  "Paramount Theatre",
  "Cedar Rapids Museum of Art",
  "McGrath Amphitheatre",
  "Palisades-Kepler State Park",
]);

registerUsCity("Iowa City", "IA", [
  "University of Iowa Pentacrest",
  "Kinnick Stadium",
  "Devonian Fossil Gorge",
  "Old Capitol Museum",
  "Iowa Avenue Literary Walk",
  "Wilson's Orchard",
  "Downtown Iowa City",
  "Terry Trueblood Recreation Area",
  "Hancher Auditorium",
]);

registerUsCity("Wichita", "KS", [
  "Sedgwick County Zoo",
  "Old Cowtown Museum",
  "Keeper of the Plains",
  "Exploration Place",
  "Botanica Wichita",
  "Museum of World Treasures",
  "The Arcade",
  "Tanganyika Wildlife Park",
  "Wichita Art Museum",
]);

registerUsCity("Overland Park", "KS", [
  "Overland Park Arboretum",
  "Deanna Rose Children's Farmstead",
  "Museum at Prairiefire",
  "Downtown Overland Park",
  "Indian Creek Trail",
  "Nerman Museum of Contemporary Art",
  "Topgolf Overland Park",
  "Town Center Plaza",
  "Johnson County Arts & Heritage Center",
]);

registerUsCity("Louisville", "KY", [
  "Kentucky Derby Museum",
  "Churchill Downs",
  "Louisville Slugger Museum",
  "Muhammad Ali Center",
  "Big Four Bridge",
  "Waterfront Park",
  "NuLu",
  "Belle of Louisville",
  "Mega Cavern",
]);

registerUsCity("Lexington", "KY", [
  "Keeneland",
  "Kentucky Horse Park",
  "Mary Todd Lincoln House",
  "Arboretum State Botanical Garden",
  "Raven Run Nature Sanctuary",
  "University of Kentucky Arboretum",
  "Distillery District",
  "Ashland Henry Clay Estate",
  "Downtown Lexington",
]);

registerUsCity("Lafayette", "LA", [
  "Avery Island",
  "Vermilionville",
  "Acadian Village",
  "Atchafalaya Basin",
  "Downtown Lafayette",
  "Acadiana Park Nature Station",
  "Cathedral of St. John the Evangelist",
  "Moncus Park",
  "Children's Museum of Acadiana",
]);

registerUsCity("Portland", "ME", [
  "Portland Head Light",
  "Old Port",
  "Eastern Promenade",
  "Casco Bay Lines",
  "Portland Museum of Art",
  "Victoria Mansion",
  "Commercial Street",
  "Fort Williams Park",
  "Peak's Island",
]);

registerUsCity("Bangor", "ME", [
  "Stephen King's House",
  "Bangor Waterfront",
  "Cole Land Transportation Museum",
  "Maine Discovery Museum",
  "Mount Hope Cemetery",
  "Penobscot River Walkway",
  "Paul Bunyan Statue",
  "Downtown Bangor",
  "Acadia National Park",
]);

registerUsCity("Baltimore", "MD", [
  "Inner Harbor",
  "National Aquarium",
  "Fort McHenry",
  "Fell's Point",
  "Oriole Park at Camden Yards",
  "American Visionary Art Museum",
  "The Walters Art Museum",
  "Federal Hill Park",
  "Maryland Science Center",
]);

registerUsCity("Frederick", "MD", [
  "Historic Downtown Frederick",
  "Carroll Creek Park",
  "National Museum of Civil War Medicine",
  "Baker Park",
  "Rose Hill Manor Park",
  "Gambrill State Park",
  "Monocacy National Battlefield",
  "Weinberg Center",
  "Frederick Fairgrounds",
]);

registerUsCity("Worcester", "MA", [
  "Worcester Art Museum",
  "EcoTarium",
  "Green Hill Park",
  "The Hanover Theatre",
  "Elm Park",
  "DCU Center",
  "American Antiquarian Society",
  "Broad Meadow Brook",
  "Institute Park",
]);

registerUsCity("Salem", "MA", [
  "Salem Witch Museum",
  "The House of the Seven Gables",
  "Peabody Essex Museum",
  "Salem Maritime National Historic Site",
  "Derby Wharf",
  "Salem Common",
  "Count Orlok's Nightmare Gallery",
  "Old Burying Point Cemetery",
  "Salem Willows",
]);

registerUsCity("Detroit", "MI", [
  "Detroit Institute of Arts",
  "The Henry Ford",
  "Motown Museum",
  "Belle Isle Park",
  "Eastern Market",
  "Comerica Park",
  "Detroit Riverwalk",
  "Fox Theatre",
  "Campus Martius Park",
]);

registerUsCity("Grand Rapids", "MI", [
  "Frederik Meijer Gardens",
  "Downtown Market",
  "Grand Rapids Art Museum",
  "John Ball Zoo",
  "Gerald R. Ford Presidential Museum",
  "Rosa Parks Circle",
  "Blandford Nature Center",
  "Bridge Street",
  "Millennium Park",
]);

registerUsCity("Duluth", "MN", [
  "Canal Park",
  "Aerial Lift Bridge",
  "Enger Tower",
  "Glensheen Mansion",
  "Great Lakes Aquarium",
  "Lakewalk",
  "Spirit Mountain",
  "Gooseberry Falls",
  "Bentleyville Tour of Lights",
]);

registerUsCity("Biloxi", "MS", [
  "Biloxi Lighthouse",
  "Beauvoir",
  "Biloxi Beach",
  "Maritime and Seafood Industry Museum",
  "MGM Park",
  "Hard Rock Casino",
  "Ship Island Excursions",
  "Ohr-O'Keefe Museum of Art",
  "Edgewater Mall",
]);

registerUsCity("Gulfport", "MS", [
  "Gulf Islands Waterpark",
  "Jones Park",
  "Mississippi Aquarium",
  "Lynn Meadows Discovery Center",
  "Gulfport Beach",
  "Ship Island",
  "Island View Casino Resort",
  "Centennial Plaza",
  "Institute for Marine Mammal Studies",
]);

registerUsCity("Missoula", "MT", [
  "Clark Fork River Trail",
  "Mount Sentinel M",
  "Caras Park",
  "Missoula Art Museum",
  "Smokejumper Visitor Center",
  "Blue Mountain Recreation Area",
  "A Carousel for Missoula",
  "Rattlesnake National Recreation Area",
  "University of Montana",
]);

registerUsCity("Bozeman", "MT", [
  "Museum of the Rockies",
  "Main Street Bozeman",
  "Bridger Bowl",
  "Bozeman Hot Springs",
  "Palisade Falls",
  "Gallatin River",
  "American Computer & Robotics Museum",
  "Hyalite Canyon",
  "Yellowstone National Park",
]);

registerUsCity("Omaha", "NE", [
  "Henry Doorly Zoo and Aquarium",
  "Old Market",
  "Lauritzen Gardens",
  "Durham Museum",
  "Bob Kerrey Pedestrian Bridge",
  "Joslyn Art Museum",
  "Gene Leahy Mall",
  "Heartland of America Park",
  "CHI Health Center",
]);

registerUsCity("Grand Island", "NE", [
  "Stuhr Museum",
  "Crane Trust Nature & Visitor Center",
  "Island Oasis Water Park",
  "Fonner Park",
  "Railside District",
  "Mormon Island State Recreation Area",
  "Heartland Events Center",
  "Grand Theatre",
  "Nebraska State Fairgrounds",
]);

registerUsCity("Reno", "NV", [
  "National Automobile Museum",
  "Riverwalk District",
  "Truckee River Walk",
  "Mt. Rose Scenic Byway",
  "The Discovery",
  "Idlewild Park",
  "Rancho San Rafael Park",
  "Peppermill Resort Spa Casino",
  "Lake Tahoe",
]);

registerUsCity("Henderson", "NV", [
  "Lake Las Vegas",
  "Clark County Heritage Museum",
  "Lion Habitat Ranch",
  "Cowabunga Bay",
  "Water Street District",
  "Sloan Canyon",
  "Ethel M Chocolate Factory",
  "Henderson Bird Viewing Preserve",
  "Sunset Station",
]);

registerUsCity("Portsmouth", "NH", [
  "Strawbery Banke Museum",
  "Prescott Park",
  "Market Square",
  "Portsmouth Harbor Lighthouse",
  "The Music Hall",
  "USS Albacore Museum",
  "Wentworth-Coolidge Mansion",
  "Odiorne Point State Park",
  "Isles of Shoals",
]);

registerUsCity("Manchester", "NH", [
  "Currier Museum of Art",
  "SNHU Arena",
  "Livingston Park",
  "Northeast Delta Dental Stadium",
  "Millyard Museum",
  "Lake Massabesic",
  "Palace Theatre",
  "McIntyre Ski Area",
  "Arms Park",
]);

registerUsCity("Newark", "NJ", [
  "Branch Brook Park",
  "Prudential Center",
  "New Jersey Performing Arts Center",
  "Newark Museum of Art",
  "Cathedral Basilica of the Sacred Heart",
  "Ironbound",
  "Military Park",
  "Riverfront Park",
  "GRAMMY Museum Experience Prudential Center",
]);

registerUsCity("Atlantic City", "NJ", [
  "Atlantic City Boardwalk",
  "Steel Pier",
  "Absecon Lighthouse",
  "Boardwalk Hall",
  "Hard Rock Hotel & Casino",
  "Lucy the Elephant",
  "Tanger Outlets",
  "Atlantic City Beach",
  "Gardner's Basin",
]);

registerUsCity("Albuquerque", "NM", [
  "Sandia Peak Tramway",
  "Old Town Albuquerque",
  "Petroglyph National Monument",
  "ABQ BioPark",
  "Indian Pueblo Cultural Center",
  "Balloon Fiesta Park",
  "Nob Hill",
  "Tinkertown Museum",
  "Breaking Bad Store",
]);

registerUsCity("Taos", "NM", [
  "Taos Pueblo",
  "Rio Grande Gorge Bridge",
  "Taos Plaza",
  "Kit Carson Home and Museum",
  "Taos Ski Valley",
  "Earthship Biotecture",
  "Millicent Rogers Museum",
  "Enchanted Circle Scenic Byway",
  "San Francisco de Asis Mission Church",
]);

registerUsCity("Buffalo", "NY", [
  "Niagara Falls",
  "Canalside",
  "Frank Lloyd Wright's Martin House",
  "Buffalo AKG Art Museum",
  "Delaware Park",
  "KeyBank Center",
  "Elmwood Village",
  "Buffalo City Hall Observation Deck",
  "Sahlen Field",
]);

registerUsCity("Rochester", "NY", [
  "The Strong National Museum of Play",
  "High Falls",
  "George Eastman Museum",
  "Highland Park",
  "Seabreeze Amusement Park",
  "Seneca Park Zoo",
  "Memorial Art Gallery",
  "Cobbs Hill Park",
  "Charlotte-Genesee Lighthouse",
]);

registerUsCity("Asheville", "NC", [
  "Biltmore Estate",
  "Blue Ridge Parkway",
  "River Arts District",
  "Downtown Asheville",
  "Pisgah National Forest",
  "The North Carolina Arboretum",
  "Mount Mitchell",
  "Omni Grove Park Inn",
  "French Broad River",
]);

registerUsCity("Fargo", "ND", [
  "Fargo Air Museum",
  "Plains Art Museum",
  "Downtown Fargo",
  "Red River Zoo",
  "Bonanzaville",
  "Lindenwood Park",
  "The Fargo Theatre",
  "Roger Maris Museum",
  "Island Park",
]);

registerUsCity("Grand Forks", "ND", [
  "Greenway",
  "University of North Dakota",
  "North Dakota Museum of Art",
  "Downtown Grand Forks",
  "Japanese Gardens",
  "Ralph Engelstad Arena",
  "Splashers of the South Seas",
  "Lincoln Drive Park",
  "Empire Arts Center",
]);

registerUsCity("Tulsa", "OK", [
  "Gathering Place",
  "Philbrook Museum of Art",
  "The Golden Driller",
  "Tulsa Arts District",
  "Woodward Park and Gardens",
  "BOK Center",
  "Cain's Ballroom",
  "Tulsa Zoo",
  "Turkey Mountain",
]);

registerUsCity("Norman", "OK", [
  "University of Oklahoma",
  "Sam Noble Museum",
  "Fred Jones Jr. Museum of Art",
  "Lake Thunderbird State Park",
  "Andrews Park",
  "Historic Campus Corner",
  "National Weather Museum",
  "Riverwind Casino",
  "Norman Firehouse Art Center",
]);

registerUsCity("Eugene", "OR", [
  "Hendricks Park",
  "Skinner Butte Park",
  "Saturday Market",
  "Mount Pisgah Arboretum",
  "Hayward Field",
  "Jordan Schnitzer Museum of Art",
  "5th Street Public Market",
  "Alton Baker Park",
  "Cascades Raptor Center",
]);

registerUsCity("Bend", "OR", [
  "Pilot Butte",
  "Old Mill District",
  "Smith Rock State Park",
  "Drake Park",
  "Deschutes River Trail",
  "High Desert Museum",
  "Tumalo Falls",
  "Mt. Bachelor",
  "Downtown Bend",
]);

registerUsCity("Newport", "RI", [
  "The Breakers",
  "Cliff Walk",
  "Bowen's Wharf",
  "Fort Adams State Park",
  "Marble House",
  "Ocean Drive",
  "International Tennis Hall of Fame",
  "Thames Street",
  "Easton's Beach",
]);

registerUsCity("Warwick", "RI", [
  "Rocky Point State Park",
  "Goddard Memorial State Park",
  "Warwick City Park",
  "Conimicut Point Park",
  "Apponaug Village",
  "Clouds Hill Museum",
  "Warwick Mall",
  "Oakland Beach",
  "Pawtuxet Village",
]);

registerUsCity("Sioux Falls", "SD", [
  "Falls Park",
  "SculptureWalk",
  "Great Plains Zoo",
  "Good Earth State Park",
  "Washington Pavilion",
  "Downtown Sioux Falls",
  "Terrace Park Japanese Gardens",
  "Butterfly House & Aquarium",
  "Arc of Dreams",
]);

registerUsCity("Rapid City", "SD", [
  "Badlands National Park",
  "Mount Rushmore",
  "Downtown Rapid City",
  "Bear Country USA",
  "Reptile Gardens",
  "Storybook Island",
  "Dinosaur Park",
  "Chapel in the Hills",
  "Custer State Park",
]);

registerUsCity("Knoxville", "TN", [
  "Market Square",
  "Sunsphere",
  "Ijams Nature Center",
  "World's Fair Park",
  "Knoxville Museum of Art",
  "Neyland Stadium",
  "Zoo Knoxville",
  "The Oliver Hotel",
  "Great Smoky Mountains National Park",
]);

registerUsCity("Chattanooga", "TN", [
  "Ruby Falls",
  "Tennessee Aquarium",
  "Lookout Mountain",
  "Rock City",
  "Walnut Street Bridge",
  "Coolidge Park",
  "Incline Railway",
  "Chattanooga Choo Choo",
  "Bluff View Art District",
]);

registerUsCity("Park City", "UT", [
  "Main Street",
  "Park City Mountain",
  "Utah Olympic Park",
  "Deer Valley Resort",
  "Alpine Coaster",
  "Swaner Preserve",
  "Jordanelle State Park",
  "Kimball Art Center",
  "Historic Main Street",
]);

registerUsCity("Moab", "UT", [
  "Arches National Park",
  "Canyonlands National Park",
  "Dead Horse Point State Park",
  "Corona Arch",
  "Hell's Revenge",
  "Colorado River Rafting",
  "Moab Giants",
  "Sand Flats Recreation Area",
  "Downtown Moab",
]);

registerUsCity("Burlington", "VT", [
  "Church Street Marketplace",
  "Waterfront Park",
  "ECHO Leahy Center",
  "Shelburne Farms",
  "Battery Park",
  "University of Vermont",
  "Oakledge Park",
  "Ben & Jerry's Factory",
  "Burlington Bike Path",
]);

registerUsCity("Stowe", "VT", [
  "Mount Mansfield",
  "Stowe Mountain Resort",
  "Smugglers Notch",
  "Stowe Recreation Path",
  "Trapp Family Lodge",
  "Moss Glen Falls",
  "Downtown Stowe",
  "Cold Hollow Cider Mill",
  "Ben & Jerry's Factory",
]);

registerUsCity("Virginia Beach", "VA", [
  "Virginia Beach Boardwalk",
  "First Landing State Park",
  "Sandbridge Beach",
  "Virginia Aquarium",
  "Cape Henry Lighthouse",
  "Town Center",
  "Back Bay National Wildlife Refuge",
  "Ocean Breeze Waterpark",
  "Mount Trashmore Park",
]);

registerUsCity("Charlottesville", "VA", [
  "Monticello",
  "University of Virginia",
  "Downtown Mall",
  "Shenandoah National Park",
  "Carter Mountain Orchard",
  "Michie Tavern",
  "Rivanna Trail",
  "Ix Art Park",
  "Ash Lawn-Highland",
]);

registerUsCity("Spokane", "WA", [
  "Riverfront Park",
  "Spokane Falls",
  "Manito Park",
  "Northwest Museum of Arts and Culture",
  "Kendall Yards",
  "Mount Spokane",
  "Bowl and Pitcher",
  "Green Bluff",
  "Downtown Spokane",
]);

registerUsCity("Tacoma", "WA", [
  "Museum of Glass",
  "Point Defiance Park",
  "LeMay America's Car Museum",
  "Chihuly Bridge of Glass",
  "Ruston Way Waterfront",
  "Tacoma Art Museum",
  "Point Defiance Zoo & Aquarium",
  "Washington State History Museum",
  "Wright Park",
]);

registerUsCity("Morgantown", "WV", [
  "West Virginia University",
  "Coopers Rock State Forest",
  "Morgantown Farmers Market",
  "Core Arboretum",
  "Monongahela River Rail-Trail",
  "Downtown Morgantown",
  "Mountaineer Field",
  "Dorsey's Knob Park",
  "Cheat Lake",
]);

registerUsCity("Huntington", "WV", [
  "Ritter Park",
  "Heritage Farm",
  "Pullman Square",
  "Huntington Museum of Art",
  "Keith-Albee Performing Arts Center",
  "Camden Park",
  "Marshall University",
  "Beech Fork State Park",
  "Harris Riverfront Park",
]);

registerUsCity("Milwaukee", "WI", [
  "Milwaukee Art Museum",
  "Harley-Davidson Museum",
  "Historic Third Ward",
  "Lakefront Brewery",
  "Milwaukee Public Market",
  "American Family Field",
  "Discovery World",
  "Bradford Beach",
  "Mitchell Park Domes",
]);

registerUsCity("Green Bay", "WI", [
  "Lambeau Field",
  "Titletown",
  "Green Bay Botanical Garden",
  "Bay Beach Amusement Park",
  "National Railroad Museum",
  "Neville Public Museum",
  "Heritage Hill State Historical Park",
  "The Automobile Gallery",
  "Downtown Green Bay",
]);

registerUsCity("Jackson", "WY", [
  "Jackson Town Square",
  "Grand Teton National Park",
  "National Elk Refuge",
  "Snow King Mountain",
  "Jackson Hole Aerial Tram",
  "Mormon Row",
  "Million Dollar Cowboy Bar",
  "Jenny Lake",
  "Cache Creek Trail",
]);

registerUsCity("Cody", "WY", [
  "Buffalo Bill Center of the West",
  "Old Trail Town",
  "Cody Nite Rodeo",
  "Buffalo Bill Dam",
  "Shoshone National Forest",
  "Yellowstone National Park",
  "Downtown Cody",
  "Cody Firearms Museum",
  "Red Canyon Wild Mustang Tours",
]);

registerCityAttractions(["Philadelphia", "Philadelphia, PA", "Philly"], [
  "Liberty Bell",
  "Independence Hall",
  "Philadelphia Museum of Art",
  "Reading Terminal Market",
  "Eastern State Penitentiary",
  "The Franklin Institute",
  "Spruce Street Harbor Park",
  "Rittenhouse Square",
  "Magic Gardens",
]);

registerCityAttractions(["Dallas", "Dallas, TX"], [
  "The Sixth Floor Museum at Dealey Plaza",
  "Dallas Arboretum and Botanical Garden",
  "Dallas Museum of Art",
  "Klyde Warren Park",
  "Reunion Tower",
  "Bishop Arts District",
  "Perot Museum of Nature and Science",
  "Deep Ellum",
  "White Rock Lake",
]);

registerCityAttractions(["Houston", "Houston, TX"], [
  "Space Center Houston",
  "Houston Museum of Natural Science",
  "The Galleria",
  "Buffalo Bayou Park",
  "Museum of Fine Arts Houston",
  "Houston Zoo",
  "Discovery Green",
  "Kemah Boardwalk",
  "The Menil Collection",
]);

registerCityAttractions(["San Antonio", "San Antonio, TX"], [
  "The Alamo",
  "San Antonio River Walk",
  "Mission San Jose",
  "The Pearl",
  "San Antonio Botanical Garden",
  "Natural Bridge Caverns",
  "Market Square",
  "San Fernando Cathedral",
  "Tower of the Americas",
]);

registerCityAttractions(["Portland", "Portland, OR", "PDX"], [
  "Washington Park",
  "Powell's City of Books",
  "Lan Su Chinese Garden",
  "International Rose Test Garden",
  "Pittock Mansion",
  "Tom McCall Waterfront Park",
  "Forest Park",
  "OMSI",
  "Pearl District",
]);

registerCityAttractions(["Minneapolis", "Minneapolis, MN"], [
  "Minnehaha Falls",
  "Mall of America",
  "Walker Art Center",
  "Minneapolis Sculpture Garden",
  "Stone Arch Bridge",
  "Chain of Lakes",
  "Mill City Museum",
  "Target Field",
  "Guthrie Theater",
]);

registerCityAttractions(["St. Louis", "St Louis", "St. Louis, MO", "St Louis, MO"], [
  "Gateway Arch",
  "Forest Park",
  "City Museum",
  "Saint Louis Zoo",
  "Missouri Botanical Garden",
  "Busch Stadium",
  "The Delmar Loop",
  "Cathedral Basilica of Saint Louis",
  "Soulard",
]);

registerCityAttractions(["Kansas City", "Kansas City, MO", "KC"], [
  "National WWI Museum and Memorial",
  "Union Station",
  "Nelson-Atkins Museum of Art",
  "Country Club Plaza",
  "Arabia Steamboat Museum",
  "Kauffman Stadium",
  "City Market",
  "18th and Vine District",
  "Loose Park",
]);

registerCityAttractions(["Cleveland", "Cleveland, OH"], [
  "Rock & Roll Hall of Fame",
  "West Side Market",
  "Cleveland Museum of Art",
  "Edgewater Park",
  "Playhouse Square",
  "Cleveland Metroparks Zoo",
  "Great Lakes Science Center",
  "Progressive Field",
  "University Circle",
]);

registerCityAttractions(["Cincinnati", "Cincinnati, OH"], [
  "Cincinnati Zoo & Botanical Garden",
  "Findlay Market",
  "Smale Riverfront Park",
  "National Underground Railroad Freedom Center",
  "Cincinnati Art Museum",
  "Krohn Conservatory",
  "Over-the-Rhine",
  "Great American Ball Park",
  "Carew Tower Observation Deck",
]);

registerCityAttractions(["Pittsburgh", "Pittsburgh, PA"], [
  "Duquesne Incline",
  "Point State Park",
  "Phipps Conservatory and Botanical Gardens",
  "Carnegie Museum of Natural History",
  "The Andy Warhol Museum",
  "Strip District",
  "Mount Washington Overlook",
  "PNC Park",
  "Cathedral of Learning",
]);

registerCityAttractions(["Tampa", "Tampa, FL"], [
  "Busch Gardens Tampa Bay",
  "Tampa Riverwalk",
  "The Florida Aquarium",
  "Ybor City",
  "ZooTampa at Lowry Park",
  "Sparkman Wharf",
  "Tampa Museum of Art",
  "Curtis Hixon Waterfront Park",
  "Bayshore Boulevard",
]);

registerCityAttractions(["Jacksonville", "Jacksonville, FL", "JAX"], [
  "Jacksonville Zoo and Gardens",
  "Cummer Museum of Art & Gardens",
  "Riverside Arts Market",
  "Little Talbot Island State Park",
  "St. Johns Town Center",
  "Jacksonville Beach",
  "Friendship Fountain",
  "MOSH",
  "Kathryn Abbey Hanna Park",
]);

registerCityAttractions(["Savannah", "Savannah, GA"], [
  "Forsyth Park",
  "River Street",
  "Bonaventure Cemetery",
  "Cathedral Basilica of St. John the Baptist",
  "City Market",
  "Wormsloe Historic Site",
  "Broughton Street",
  "Jones Street",
  "Old Fort Jackson",
]);

registerCityAttractions(["Memphis", "Memphis, TN"], [
  "Graceland",
  "Beale Street",
  "National Civil Rights Museum",
  "Sun Studio",
  "Memphis Zoo",
  "Shelby Farms Park",
  "Stax Museum of American Soul Music",
  "Peabody Ducks",
  "Bass Pro Shops at the Pyramid",
]);

registerCityAttractions(["Charleston", "Charleston, SC"], [
  "Waterfront Park",
  "Rainbow Row",
  "Magnolia Plantation and Gardens",
  "Fort Sumter",
  "Charleston City Market",
  "The Battery",
  "King Street",
  "Middleton Place",
  "Sullivan's Island Beach",
]);

registerCityAttractions(["Myrtle Beach", "Myrtle Beach, SC"], [
  "Myrtle Beach Boardwalk",
  "Broadway at the Beach",
  "SkyWheel Myrtle Beach",
  "Myrtle Beach State Park",
  "Ripley's Aquarium",
  "Barefoot Landing",
  "Brookgreen Gardens",
  "Murrells Inlet MarshWalk",
  "Family Kingdom Amusement Park",
]);

registerCityAttractions(["Paris", "Paris, France"], [
  "Eiffel Tower",
  "Louvre Museum",
  "Palace of Versailles",
  "Catacombs of Paris",
  "Notre-Dame Cathedral",
  "Arc de Triomphe",
  "Sacre-Coeur Basilica",
  "Musee d'Orsay",
  "Luxembourg Gardens",
]);

registerCityAttractions(["London", "London, UK", "London, England"], [
  "Buckingham Palace",
  "Tower of London",
  "Big Ben",
  "British Museum",
  "London Eye",
  "Westminster Abbey",
  "St Paul's Cathedral",
  "Tower Bridge",
  "Hyde Park",
]);

registerCityAttractions(["Rome", "Rome, Italy"], [
  "Colosseum",
  "Roman Forum",
  "Trevi Fountain",
  "Pantheon",
  "Vatican Museums",
  "St. Peter's Basilica",
  "Spanish Steps",
  "Piazza Navona",
  "Villa Borghese",
]);

registerCityAttractions(["New York", "New York City", "New York, NY", "NYC", "NY"], [
  "Statue of Liberty",
  "Central Park",
  "Times Square",
  "Empire State Building",
  "Brooklyn Bridge",
  "The Metropolitan Museum of Art",
  "One World Observatory",
  "Rockefeller Center",
  "Grand Central Terminal",
]);

registerCityAttractions(["Washington", "Washington, DC", "DC"], [
  "National Mall",
  "Lincoln Memorial",
  "Smithsonian National Museum of Natural History",
  "Washington Monument",
  "United States Capitol",
  "White House",
  "National Air and Space Museum",
  "Georgetown Waterfront",
  "Library of Congress",
]);

registerCityAttractions(["Chicago", "Chicago, IL"], [
  "Millennium Park",
  "Art Institute of Chicago",
  "Navy Pier",
  "Willis Tower Skydeck",
  "Chicago Riverwalk",
  "Wrigley Field",
  "Museum of Science and Industry",
  "The Magnificent Mile",
  "Shedd Aquarium",
]);

registerCityAttractions(["Los Angeles", "Los Angeles, CA", "LA"], [
  "Griffith Observatory",
  "Hollywood Sign",
  "Santa Monica Pier",
  "The Getty Center",
  "Universal Studios Hollywood",
  "Venice Beach",
  "Runyon Canyon",
  "LACMA",
  "The Grove",
]);

registerCityAttractions(["San Francisco", "San Francisco, CA", "SF"], [
  "Golden Gate Bridge",
  "Alcatraz Island",
  "Fisherman's Wharf",
  "Golden Gate Park",
  "Lombard Street",
  "Pier 39",
  "Palace of Fine Arts",
  "Chinatown",
  "Exploratorium",
]);

registerCityAttractions(["Seattle", "Seattle, WA"], [
  "Space Needle",
  "Pike Place Market",
  "Chihuly Garden and Glass",
  "Museum of Pop Culture",
  "Discovery Park",
  "Seattle Aquarium",
  "Kerry Park",
  "Washington State Ferries",
  "Gas Works Park",
]);

registerCityAttractions(["Boston", "Boston, MA"], [
  "Freedom Trail",
  "Fenway Park",
  "Boston Common",
  "Museum of Fine Arts",
  "Faneuil Hall Marketplace",
  "New England Aquarium",
  "Paul Revere House",
  "Isabella Stewart Gardner Museum",
  "Boston Public Garden",
]);

registerCityAttractions(["Miami", "Miami, FL"], [
  "South Beach",
  "Vizcaya Museum and Gardens",
  "Wynwood Walls",
  "Bayside Marketplace",
  "Little Havana",
  "Frost Science Museum",
  "Perezt Art Museum Miami",
  "Miami Beach Boardwalk",
  "Zoo Miami",
]);

registerCityAttractions(["Las Vegas", "Las Vegas, NV", "Vegas"], [
  "Las Vegas Strip",
  "Bellagio Fountains",
  "Fremont Street Experience",
  "Red Rock Canyon",
  "The Venetian Grand Canal",
  "High Roller",
  "Neon Museum",
  "Sphere",
  "Hoover Dam",
]);

registerCityAttractions(["New Orleans", "New Orleans, LA"], [
  "French Quarter",
  "Jackson Square",
  "Garden District",
  "National WWII Museum",
  "Bourbon Street",
  "St. Louis Cathedral",
  "Steamboat Natchez",
  "City Park",
  "Cafe du Monde",
]);

registerCityAttractions(["Nashville", "Nashville, TN"], [
  "Grand Ole Opry",
  "Country Music Hall of Fame",
  "Broadway",
  "Ryman Auditorium",
  "The Parthenon",
  "Belle Meade Historic Site",
  "Johnny Cash Museum",
  "Centennial Park",
  "Frist Art Museum",
]);

registerCityAttractions(["Orlando", "Orlando, FL"], [
  "Walt Disney World",
  "Universal Orlando Resort",
  "SeaWorld Orlando",
  "ICON Park",
  "Disney Springs",
  "Lake Eola Park",
  "Kennedy Space Center",
  "The Wizarding World of Harry Potter",
  "Gatorland",
]);

registerCityAttractions(["San Diego", "San Diego, CA"], [
  "Balboa Park",
  "San Diego Zoo",
  "La Jolla Cove",
  "USS Midway Museum",
  "Gaslamp Quarter",
  "Coronado Beach",
  "Seaport Village",
  "Old Town San Diego",
  "Torrey Pines State Natural Reserve",
]);

registerCityAttractions(["Toronto", "Toronto, ON"], [
  "CN Tower",
  "Royal Ontario Museum",
  "Ripley's Aquarium of Canada",
  "Distillery District",
  "Toronto Islands",
  "St. Lawrence Market",
  "Art Gallery of Ontario",
  "Casa Loma",
  "Hockey Hall of Fame",
]);

registerCityAttractions(["Vancouver", "Vancouver, BC"], [
  "Stanley Park",
  "Granville Island",
  "Capilano Suspension Bridge",
  "Gastown",
  "Vancouver Aquarium",
  "Grouse Mountain",
  "Canada Place",
  "English Bay",
  "VanDusen Botanical Garden",
]);

registerCityAttractions(["Montreal", "Montreal, QC"], [
  "Old Montreal",
  "Notre-Dame Basilica of Montreal",
  "Mount Royal Park",
  "Montreal Botanical Garden",
  "Jean-Talon Market",
  "Montreal Museum of Fine Arts",
  "Saint Joseph's Oratory",
  "Biodome",
  "Place d'Armes",
]);

registerCityAttractions(["Mexico City", "CDMX"], [
  "Zocalo",
  "Frida Kahlo Museum",
  "Chapultepec Castle",
  "Palacio de Bellas Artes",
  "Templo Mayor",
  "Teotihuacan",
  "Xochimilco",
  "National Museum of Anthropology",
  "Coyoacan",
]);

registerCityAttractions(["Barcelona", "Barcelona, Spain"], [
  "Sagrada Familia",
  "Park Guell",
  "La Rambla",
  "Casa Batllo",
  "Gothic Quarter",
  "Magic Fountain of Montjuic",
  "Barceloneta Beach",
  "Mercado de La Boqueria",
  "Palau de la Musica Catalana",
]);

registerCityAttractions(["Madrid", "Madrid, Spain"], [
  "Prado Museum",
  "Royal Palace of Madrid",
  "Retiro Park",
  "Plaza Mayor",
  "Puerta del Sol",
  "Reina Sofia Museum",
  "Gran Via",
  "Temple of Debod",
  "Mercado de San Miguel",
]);

registerCityAttractions(["Amsterdam", "Amsterdam, Netherlands"], [
  "Anne Frank House",
  "Rijksmuseum",
  "Van Gogh Museum",
  "Jordaan",
  "Vondelpark",
  "Canal Cruise",
  "Dam Square",
  "Heineken Experience",
  "Bloemenmarkt",
]);

registerCityAttractions(["Berlin", "Berlin, Germany"], [
  "Brandenburg Gate",
  "Berlin Wall Memorial",
  "Museum Island",
  "Reichstag Building",
  "Checkpoint Charlie",
  "East Side Gallery",
  "Tiergarten",
  "Berlin Cathedral",
  "Charlottenburg Palace",
]);

registerCityAttractions(["Lisbon", "Lisbon, Portugal"], [
  "Belem Tower",
  "Jeronimos Monastery",
  "Alfama",
  "Sao Jorge Castle",
  "Praça do Comercio",
  "Time Out Market",
  "Tram 28",
  "LX Factory",
  "Oceanario de Lisboa",
]);

registerCityAttractions(["Dublin", "Dublin, Ireland"], [
  "Guinness Storehouse",
  "Trinity College",
  "Dublin Castle",
  "St. Patrick's Cathedral",
  "Temple Bar",
  "Kilmainham Gaol",
  "Phoenix Park",
  "National Gallery of Ireland",
  "EPIC The Irish Emigration Museum",
]);

registerCityAttractions(["Prague", "Prague, Czech Republic"], [
  "Charles Bridge",
  "Prague Castle",
  "Old Town Square",
  "Astronomical Clock",
  "St. Vitus Cathedral",
  "Petrin Tower",
  "Wenceslas Square",
  "Josefov",
  "Dancing House",
]);

registerCityAttractions(["Vienna", "Vienna, Austria"], [
  "Schonbrunn Palace",
  "St. Stephen's Cathedral",
  "Belvedere Palace",
  "Hofburg Palace",
  "Prater",
  "Vienna State Opera",
  "MuseumsQuartier",
  "Naschmarkt",
  "Albertina Museum",
]);

registerCityAttractions(["Athens", "Athens, Greece"], [
  "Acropolis",
  "Parthenon",
  "Acropolis Museum",
  "Plaka",
  "Ancient Agora of Athens",
  "Temple of Olympian Zeus",
  "Mount Lycabettus",
  "National Archaeological Museum",
  "Monastiraki Square",
]);

registerCityAttractions(["Istanbul", "Istanbul, Turkey"], [
  "Hagia Sophia",
  "Blue Mosque",
  "Topkapi Palace",
  "Grand Bazaar",
  "Basilica Cistern",
  "Galata Tower",
  "Spice Bazaar",
  "Bosphorus Cruise",
  "Dolmabahce Palace",
]);

registerCityAttractions(["Dubai", "Dubai, UAE"], [
  "Burj Khalifa",
  "Dubai Mall",
  "Dubai Fountain",
  "Palm Jumeirah",
  "Dubai Marina",
  "Museum of the Future",
  "Burj Al Arab",
  "Dubai Miracle Garden",
  "Desert Safari",
]);

registerCityAttractions(["Singapore"], [
  "Gardens by the Bay",
  "Marina Bay Sands",
  "Sentosa Island",
  "Singapore Botanic Gardens",
  "Merlion Park",
  "Chinatown",
  "Clarke Quay",
  "Jewel Changi",
  "National Gallery Singapore",
]);

registerCityAttractions(["Tokyo", "Tokyo, Japan"], [
  "Senso-ji Temple",
  "Tokyo Skytree",
  "Shibuya Crossing",
  "Meiji Shrine",
  "Tokyo Tower",
  "Tsukiji Outer Market",
  "Ueno Park",
  "Imperial Palace",
  "teamLab Planets",
]);

registerCityAttractions(["Kyoto", "Kyoto, Japan"], [
  "Fushimi Inari Shrine",
  "Kinkaku-ji",
  "Arashiyama Bamboo Grove",
  "Kiyomizu-dera",
  "Gion",
  "Nishiki Market",
  "Philosopher's Path",
  "Nijo Castle",
  "Ryoan-ji",
]);

registerCityAttractions(["Osaka", "Osaka, Japan"], [
  "Osaka Castle",
  "Dotonbori",
  "Universal Studios Japan",
  "Kuromon Market",
  "Umeda Sky Building",
  "Shinsekai",
  "Sumiyoshi Taisha",
  "Osaka Aquarium Kaiyukan",
  "Abeno Harukas",
]);

registerCityAttractions(["Seoul", "Seoul, South Korea"], [
  "Gyeongbokgung Palace",
  "Bukchon Hanok Village",
  "N Seoul Tower",
  "Myeongdong",
  "Changdeokgung Palace",
  "Dongdaemun Design Plaza",
  "Lotte World Tower",
  "Insadong",
  "Hongdae",
]);

registerCityAttractions(["Bangkok", "Bangkok, Thailand"], [
  "Grand Palace",
  "Wat Arun",
  "Wat Pho",
  "Chatuchak Market",
  "Jim Thompson House",
  "Asiatique The Riverfront",
  "Khao San Road",
  "Lumphini Park",
  "ICONSIAM",
]);

registerCityAttractions(["Hong Kong"], [
  "Victoria Peak",
  "Star Ferry",
  "Tsim Sha Tsui Promenade",
  "Hong Kong Disneyland",
  "Tian Tan Buddha",
  "Temple Street Night Market",
  "Ocean Park",
  "Nan Lian Garden",
  "Avenue of Stars",
]);

registerCityAttractions(["Sydney", "Sydney, Australia"], [
  "Sydney Opera House",
  "Sydney Harbour Bridge",
  "Bondi Beach",
  "The Rocks",
  "Taronga Zoo",
  "Royal Botanic Garden",
  "Manly Beach",
  "Darling Harbour",
  "Art Gallery of New South Wales",
]);

registerCityAttractions(["Melbourne", "Melbourne, Australia"], [
  "Federation Square",
  "Royal Botanic Gardens Victoria",
  "Queen Victoria Market",
  "St Kilda Beach",
  "Melbourne Cricket Ground",
  "National Gallery of Victoria",
  "Hosier Lane",
  "Brighton Bathing Boxes",
  "Eureka Skydeck",
]);

registerUsStateCapital("Montgomery", "AL", [
  "Alabama State Capitol",
  "Legacy Museum",
  "National Memorial for Peace and Justice",
  "Riverfront Park",
  "Civil Rights Memorial Center",
  "The First White House of the Confederacy",
  "Dexter Avenue King Memorial Baptist Church",
  "Alabama Department of Archives and History",
  "Montgomery Museum of Fine Arts",
]);

registerUsStateCapital("Juneau", "AK", [
  "Mendenhall Glacier",
  "Mount Roberts Tramway",
  "Alaska State Museum",
  "Glacier Gardens Rainforest Adventure",
  "Nugget Falls",
  "Whale Watching Tours",
  "Downtown Juneau Historic District",
  "Last Chance Mining Museum",
  "Eagle Beach",
]);

registerUsStateCapital("Phoenix", "AZ", [
  "Desert Botanical Garden",
  "Camelback Mountain",
  "Musical Instrument Museum",
  "Heard Museum",
  "Phoenix Art Museum",
  "Papago Park",
  "South Mountain Park",
  "Hole-in-the-Rock",
  "Old Town Scottsdale",
]);

registerUsStateCapital("Little Rock", "AR", [
  "Little Rock Central High School National Historic Site",
  "William J. Clinton Presidential Library",
  "River Market District",
  "Big Dam Bridge",
  "Arkansas State Capitol",
  "Pinnacle Mountain State Park",
  "Museum of Discovery",
  "Old State House Museum",
  "Little Rock Zoo",
]);

registerUsStateCapital("Sacramento", "CA", [
  "California State Capitol Museum",
  "Old Sacramento Waterfront",
  "Crocker Art Museum",
  "California State Railroad Museum",
  "Sutter's Fort State Historic Park",
  "Tower Bridge",
  "Midtown Sacramento",
  "Golden 1 Center",
  "McKinley Park Rose Garden",
]);

registerUsStateCapital("Denver", "CO", [
  "Red Rocks Park and Amphitheatre",
  "Denver Art Museum",
  "Union Station",
  "Denver Botanic Gardens",
  "Colorado State Capitol",
  "Larimer Square",
  "Meow Wolf Denver",
  "City Park",
  "Coors Field",
]);

registerUsStateCapital("Hartford", "CT", [
  "Mark Twain House & Museum",
  "Wadsworth Atheneum Museum of Art",
  "Connecticut State Capitol",
  "Elizabeth Park Conservancy",
  "Bushnell Park",
  "Connecticut Science Center",
  "Harriet Beecher Stowe Center",
  "The Old State House",
  "Riverfront Recapture",
]);

registerUsStateCapital("Dover", "DE", [
  "First State Heritage Park",
  "Air Mobility Command Museum",
  "John Dickinson Plantation",
  "Delaware State Capitol",
  "Biggs Museum of American Art",
  "The Old State House",
  "Legislative Hall",
  "Silver Lake Park",
  "Bombay Hook National Wildlife Refuge",
]);

registerUsStateCapital("Tallahassee", "FL", [
  "Florida State Capitol",
  "Cascades Park",
  "Museum of Florida History",
  "Tallahassee Museum",
  "Mission San Luis",
  "Alfred B. Maclay Gardens State Park",
  "St. Marks National Wildlife Refuge",
  "Railroad Square Art District",
  "Florida Historic Capitol Museum",
]);

registerUsStateCapital("Atlanta", "GA", [
  "Georgia Aquarium",
  "World of Coca-Cola",
  "Atlanta Botanical Garden",
  "Piedmont Park",
  "Martin Luther King Jr. National Historical Park",
  "Fox Theatre",
  "High Museum of Art",
  "BeltLine Eastside Trail",
  "Zoo Atlanta",
], ["ATL"]);

registerUsStateCapital("Honolulu", "HI", [
  "Waikiki Beach",
  "Pearl Harbor National Memorial",
  "Diamond Head State Monument",
  "Iolani Palace",
  "Hanauma Bay",
  "Bishop Museum",
  "Koko Crater Railway Trail",
  "Ala Moana Beach Park",
  "Manoa Falls",
]);

registerUsStateCapital("Boise", "ID", [
  "Boise River Greenbelt",
  "Old Idaho Penitentiary",
  "Idaho State Capitol",
  "Julia Davis Park",
  "Boise Foothills",
  "Freak Alley Gallery",
  "Idaho Botanical Garden",
  "Basque Block",
  "Bogus Basin",
]);

registerUsStateCapital("Springfield", "IL", [
  "Abraham Lincoln Presidential Library and Museum",
  "Lincoln Home National Historic Site",
  "Illinois State Capitol",
  "Dana-Thomas House",
  "Old State Capitol State Historic Site",
  "Lincoln Tomb",
  "Washington Park Botanical Garden",
  "Illinois State Museum",
  "Route 66 Drive-In",
]);

registerUsStateCapital("Indianapolis", "IN", [
  "Indianapolis Motor Speedway Museum",
  "Monument Circle",
  "The Children's Museum of Indianapolis",
  "White River State Park",
  "Newfields",
  "Indiana State Museum",
  "Mass Ave",
  "Indianapolis Zoo",
  "Indiana War Memorial",
]);

registerUsStateCapital("Des Moines", "IA", [
  "Iowa State Capitol",
  "Pappajohn Sculpture Park",
  "Greater Des Moines Botanical Garden",
  "East Village",
  "Blank Park Zoo",
  "Science Center of Iowa",
  "Principal Park",
  "Des Moines Art Center",
  "Gray's Lake Park",
]);

registerUsStateCapital("Topeka", "KS", [
  "Kansas State Capitol",
  "Brown v. Board of Education National Historical Park",
  "Evel Knievel Museum",
  "Gage Park",
  "Combat Air Museum",
  "Lake Shawnee",
  "Ward-Meade Historic Site",
  "Topeka Zoo",
  "Kansas Museum of History",
]);

registerUsStateCapital("Frankfort", "KY", [
  "Kentucky State Capitol",
  "Buffalo Trace Distillery",
  "Salato Wildlife Education Center",
  "Thomas D. Clark Center for Kentucky History",
  "Liberty Hall Historic Site",
  "Josephine Sculpture Park",
  "Old State Capitol",
  "Rebecca Ruth Candy Tours",
  "Cove Spring Park",
]);

registerUsStateCapital("Baton Rouge", "LA", [
  "Louisiana State Capitol",
  "USS Kidd Veterans Museum",
  "Capitol Park Museum",
  "Old State Capitol",
  "LSU Rural Life Museum",
  "Bluebonnet Swamp Nature Center",
  "Magnolia Mound Plantation",
  "Louisiana Art & Science Museum",
  "Mike the Tiger's Habitat",
]);

registerUsStateCapital("Augusta", "ME", [
  "Maine State House",
  "Maine State Museum",
  "Old Fort Western",
  "Capitol Park",
  "Viles Arboretum",
  "Kennebec River Rail Trail",
  "Children's Discovery Museum",
  "Blaine House",
  "Cushnoc Brewing Co.",
]);

registerUsStateCapital("Annapolis", "MD", [
  "United States Naval Academy",
  "Maryland State House",
  "Historic Annapolis",
  "William Paca House & Garden",
  "City Dock",
  "Quiet Waters Park",
  "Banneker-Douglass-Tubman Museum",
  "St. Anne's Church",
  "Sandy Point State Park",
]);

registerUsStateCapital("Boston", "MA", [
  "Freedom Trail",
  "Fenway Park",
  "Boston Common",
  "Museum of Fine Arts",
  "Faneuil Hall Marketplace",
  "New England Aquarium",
  "Paul Revere House",
  "Isabella Stewart Gardner Museum",
  "Boston Public Garden",
]);

registerUsStateCapital("Lansing", "MI", [
  "Michigan State Capitol",
  "Potter Park Zoo",
  "Michigan History Center",
  "Old Town Lansing",
  "Impression 5 Science Center",
  "W.J. Beal Botanical Garden",
  "R.E. Olds Transportation Museum",
  "Hawk Island Park",
  "River Trail",
]);

registerUsStateCapital("Saint Paul", "MN", [
  "Cathedral of Saint Paul",
  "Minnesota State Capitol",
  "Como Park Zoo and Conservatory",
  "Science Museum of Minnesota",
  "Summit Avenue",
  "Xcel Energy Center",
  "Minnesota History Center",
  "Rice Park",
  "Ordway Center for the Performing Arts",
], ["St. Paul", "St Paul"]);

registerUsStateCapital("Jackson", "MS", [
  "Mississippi State Capitol",
  "Mississippi Civil Rights Museum",
  "Mississippi Museum of Natural Science",
  "LeFleur's Bluff State Park",
  "Old Capitol Museum",
  "Eudora Welty House & Garden",
  "Mississippi Children's Museum",
  "Fondren District",
  "Medgar and Myrlie Evers Home National Monument",
]);

registerUsStateCapital("Jefferson City", "MO", [
  "Missouri State Capitol",
  "Missouri State Penitentiary",
  "Runge Nature Center",
  "Museum of Missouri Military History",
  "Capitol City Riverfront",
  "Carnahan Memorial Garden",
  "Jefferson Landing State Historic Site",
  "Binder Park",
  "Cole County Historical Museum",
]);

registerUsStateCapital("Helena", "MT", [
  "Montana State Capitol",
  "Mount Helena City Park",
  "Cathedral of Saint Helena",
  "Gates of the Mountains",
  "Reeder's Alley",
  "Archie Bray Foundation",
  "Original Governor's Mansion",
  "Holter Museum of Art",
  "Last Chance Gulch",
]);

registerUsStateCapital("Lincoln", "NE", [
  "Nebraska State Capitol",
  "Sunken Gardens",
  "Pioneers Park Nature Center",
  "Museum of American Speed",
  "Lincoln Children's Zoo",
  "Haymarket District",
  "Sheldon Museum of Art",
  "Memorial Stadium",
  "International Quilt Museum",
]);

registerUsStateCapital("Carson City", "NV", [
  "Nevada State Museum",
  "Nevada State Capitol Building",
  "Kit Carson Trail",
  "Kings Canyon Waterfall",
  "Lake Tahoe Nevada State Park",
  "Mills Park",
  "Stewart Indian School Cultural Center",
  "Children's Museum of Northern Nevada",
  "Virginia City",
]);

registerUsStateCapital("Concord", "NH", [
  "New Hampshire State House",
  "McAuliffe-Shepard Discovery Center",
  "White Park",
  "Pierce Manse",
  "Capitol Center for the Arts",
  "Concord Craft Brewing",
  "Beaver Meadow Golf Course",
  "Winant Park",
  "New Hampshire Historical Society",
]);

registerUsStateCapital("Trenton", "NJ", [
  "New Jersey State House",
  "Old Barracks Museum",
  "New Jersey State Museum",
  "Grounds For Sculpture",
  "Trenton Battle Monument",
  "Cadwalader Park",
  "Olden House",
  "Patriots Theater at the War Memorial",
  "Delaware and Raritan Canal State Park",
]);

registerUsStateCapital("Santa Fe", "NM", [
  "Santa Fe Plaza",
  "Georgia O'Keeffe Museum",
  "Canyon Road",
  "Loretto Chapel",
  "Museum of International Folk Art",
  "New Mexico State Capitol",
  "Meow Wolf Santa Fe",
  "Palace of the Governors",
  "Bandelier National Monument",
]);

registerUsStateCapital("Albany", "NY", [
  "New York State Capitol",
  "The Egg",
  "New York State Museum",
  "Washington Park",
  "USS Slater",
  "Empire State Plaza",
  "Albany Institute of History & Art",
  "Schuyler Mansion",
  "Crossgates Mall",
]);

registerUsStateCapital("Raleigh", "NC", [
  "North Carolina Museum of Natural Sciences",
  "North Carolina Museum of Art",
  "Pullen Park",
  "North Carolina State Capitol",
  "JC Raulston Arboretum",
  "Marbles Kids Museum",
  "Dorothea Dix Park",
  "William B. Umstead State Park",
  "Historic Yates Mill County Park",
]);

registerUsStateCapital("Bismarck", "ND", [
  "North Dakota State Capitol",
  "North Dakota Heritage Center",
  "Fort Abraham Lincoln State Park",
  "Dakota Zoo",
  "Bismarck Riverfront",
  "Former Governor's Mansion",
  "Keelboat Park",
  "SuperSlide Amusement Park",
  "Missouri River Pedestrian Bridge",
]);

registerUsStateCapital("Columbus", "OH", [
  "Franklin Park Conservatory",
  "Columbus Zoo and Aquarium",
  "Ohio Statehouse",
  "North Market",
  "German Village",
  "COSI",
  "Short North Arts District",
  "Scioto Mile",
  "The Ohio State University",
]);

registerUsStateCapital("Oklahoma City", "OK", [
  "National Cowboy & Western Heritage Museum",
  "Oklahoma City National Memorial",
  "Bricktown",
  "Myriad Botanical Gardens",
  "Scissortail Park",
  "Oklahoma State Capitol",
  "Oklahoma City Museum of Art",
  "Riversport OKC",
  "First Americans Museum",
]);

registerUsStateCapital("Salem", "OR", [
  "Oregon State Capitol",
  "Willamette Heritage Center",
  "Riverfront City Park",
  "Bush's Pasture Park",
  "Enchanted Forest",
  "Deepwood Museum & Gardens",
  "Hallie Ford Museum of Art",
  "Minto-Brown Island Park",
  "Gilbert House Children's Museum",
]);

registerUsStateCapital("Harrisburg", "PA", [
  "Pennsylvania State Capitol",
  "National Civil War Museum",
  "City Island",
  "Broad Street Market",
  "State Museum of Pennsylvania",
  "Wildwood Park",
  "Whitaker Center",
  "Fort Hunter Mansion and Park",
  "Riverfront Park",
]);

registerUsStateCapital("Providence", "RI", [
  "WaterFire",
  "RISD Museum",
  "Roger Williams Park",
  "Rhode Island State House",
  "Brown University",
  "Benefit Street",
  "Federal Hill",
  "Providence Performing Arts Center",
  "Roger Williams Park Zoo",
]);

registerUsStateCapital("Columbia", "SC", [
  "South Carolina State House",
  "Riverbanks Zoo and Garden",
  "Congaree National Park",
  "South Carolina State Museum",
  "Congaree Vista",
  "Columbia Museum of Art",
  "Finlay Park",
  "Saluda Shoals Park",
  "EdVenture Children's Museum",
]);

registerUsStateCapital("Pierre", "SD", [
  "South Dakota State Capitol",
  "La Framboise Island Nature Area",
  "South Dakota Discovery Center",
  "Oahe Dam",
  "Casey Tibbs South Dakota Rodeo Center",
  "Fighting Stallions Memorial",
  "Capitol Lake",
  "Trail of Governors",
  "Missouri River Boat Tours",
]);

registerUsStateCapital("Nashville", "TN", [
  "Grand Ole Opry",
  "Country Music Hall of Fame",
  "Broadway",
  "Ryman Auditorium",
  "The Parthenon",
  "Belle Meade Historic Site",
  "Johnny Cash Museum",
  "Centennial Park",
  "Frist Art Museum",
]);

registerUsStateCapital("Austin", "TX", [
  "Texas State Capitol",
  "Lady Bird Lake",
  "Barton Springs Pool",
  "South Congress Avenue",
  "Zilker Park",
  "The University of Texas Tower",
  "Bullock Texas State History Museum",
  "Congress Avenue Bridge Bats",
  "Blanton Museum of Art",
]);

registerUsStateCapital("Salt Lake City", "UT", [
  "Temple Square",
  "Utah State Capitol",
  "Red Butte Garden",
  "Natural History Museum of Utah",
  "Antelope Island State Park",
  "Ensign Peak",
  "Liberty Park",
  "Tracy Aviary",
  "Clark Planetarium",
]);

registerUsStateCapital("Montpelier", "VT", [
  "Vermont State House",
  "Hubbard Park",
  "Vermont History Museum",
  "North Branch Nature Center",
  "Morse Farm Maple Sugarworks",
  "Lost Nation Theater",
  "Vermont College of Fine Arts",
  "Camel's Hump",
  "Rock of Ages Quarry",
]);

registerUsStateCapital("Richmond", "VA", [
  "Virginia State Capitol",
  "Maymont",
  "Lewis Ginter Botanical Garden",
  "Virginia Museum of Fine Arts",
  "Carytown",
  "Belle Isle",
  "Hollywood Cemetery",
  "The American Civil War Museum",
  "Canal Walk",
]);

registerUsStateCapital("Olympia", "WA", [
  "Washington State Capitol",
  "Percival Landing Park",
  "Nisqually National Wildlife Refuge",
  "Hands On Children's Museum",
  "Tumwater Falls",
  "Olympic Flight Museum",
  "Squaxin Park",
  "Farmers Market",
  "Priest Point Park",
]);

registerUsStateCapital("Charleston", "WV", [
  "West Virginia State Capitol",
  "Capitol Market",
  "Kanawha State Forest",
  "Clay Center",
  "Haddad Riverfront Park",
  "West Virginia State Museum",
  "Carriage Trail",
  "Magic Island Park",
  "University of Charleston",
]);

registerUsStateCapital("Madison", "WI", [
  "Wisconsin State Capitol",
  "Olbrich Botanical Gardens",
  "Memorial Union Terrace",
  "Henry Vilas Zoo",
  "State Street",
  "Monona Terrace",
  "Chazen Museum of Art",
  "University of Wisconsin Arboretum",
  "Lake Mendota",
]);

registerUsStateCapital("Cheyenne", "WY", [
  "Wyoming State Capitol",
  "Cheyenne Frontier Days Old West Museum",
  "Cheyenne Depot Museum",
  "Curt Gowdy State Park",
  "Terry Bison Ranch",
  "Botanic Gardens",
  "Big Boy Steam Engine",
  "Vedauwoo Recreation Area",
  "Wyoming State Museum",
]);

export const getCityAttractions = (city: string) => {
  const normalized = normalizeCityKey(city);
  const cityOnly = normalizeCityKey(city.split(",")[0] ?? city);

  return cityAttractions[normalized] || cityAttractions[cityOnly] || [];
};

export const hasCityAttractions = (city: string) => getCityAttractions(city).length > 0;
