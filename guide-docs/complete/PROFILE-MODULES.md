# Bridger — Profile Modules (the canonical question bank)

Every fill-out module: its questions, follow-ups, defaults, and closing steps. This is the **content source of truth** for the profile builder — `PROFILE.md` says where modules surface (the Favorites "to start" grid + module menu); this doc says exactly what's inside each. All modules use the baseline one-question-per-screen flow (Typeform feel, per `ONBOARDING.md`), are fully optional, can be saved/resumed, and **cancel saves nothing**.

**Every module ends with the same two closing steps** (`PROFILE.md` §11):
1. **Who sees this** — Review & share: **Set all** (Close / Friends / Everyone) + per-item overrides. Defaults below per module.
2. **Use this to connect me?** — the separate, explicit `matchable` consent for Discover.

Every answer is an `attributes` row (unlimited per category, each independently visible + matchable).

---

## The module menu

The profile builder shows these as cards — each with its description, estimated time, questions-answered count, **Continue / Edit**, and a live profile preview of how answers will appear.

| # | Module | Card description | Default visibility |
|---|---|---|---|
| 1 | **About Me Basics** | The simple stuff friends usually ask first. | Friends |
| 2 | **About Me Deeper** | The personal details worth remembering. | Close friends |
| 3 | **Hobbies & Interests** | What you enjoy and what you're into. | Everyone |
| 4 | **Favorite Food & Drinks** | Your favorites, usual orders, and go-to spots. | Everyone |
| 5 | **Favorite Entertainment** | What you watch, read, play, and recommend. | Everyone |
| 6 | **Everyday Favorites** | Small favorites that say a lot about you. | Everyone |
| 7 | **Sports Favorites** | The teams and sports you follow or play. | Everyone |
| 8 | **This or That** | Fast choices that show your personality. | Everyone |
| 9 | **Places You've Been** | Where you've lived, visited, and want to go. | Friends |
| 10 | **Top 5** | 5 things anyone who knows you well needs to know. | Friends |
| 11 | **Current Obsession** | Who you are today — reading, building, training for… | Friends |
| 12 | **Life Timeline** | Education, jobs, cities, and defining moments. | Friends |
| 13 | **Recommendations** | The things people HAVE to do/read/watch, per you. | Everyone |
| 14 | **Goals** | Big wants — feeds your Bucket List. | Close friends |

(10–14 are specced in `PROFILE.md` §4–§10; this doc details 1–9.)

---

## Module 1 · About Me Basics — "A little about you"

*Start with the details friends are most likely to need. Everything is optional.*

**Basic information**
- **When is your birthday?** — pulled from onboarding, shown to confirm/update.
- Any nicknames?
- What pronouns do you use?

**Where you're from**
- Where are you from?
- What town do you live in now?

**School and work**
- Where did you go to high school?
- Where did you go to college?
- What did you study?
- What's your current job title?
- What's your dream job?

**Food and dietary**
- Any food allergies? *(feeds the private allergy line on events — `EVENTS.md`)*
- Any dietary restrictions?

**Pets**
- What pets do you have? *(hint: add the type or breed)*
- What are your pets' names?

**Zodiac**
- What's your zodiac? — **auto-guessed from birthday:** "Based on your birthday, we guessed: Sun: {sign}. Add the others if you know them." Fields: **Sun · Moon · Rising**.
- Empty state (no birthday): *"Add or confirm your birthday to automatically fill in your sun sign."*

Each answer asks **Who can see this?**

---

## Module 2 · About Me Deeper — "The more personal stuff"

*Share the details you'd want closer friends to understand or remember. Everything is optional.* Default: **Close friends**.

**Personal details**
- What's your middle name?

**Family**
- **Who's in your family?** — repeatable entries: **Name + Relation** (mom, brother, sister, kid, partner, chosen family…). **Drag to reorder.**
- **Where do you fall in line?** — add your siblings and yourself, then **drag everyone oldest → youngest**.

**Identity**
- Ethnicity or heritage?
- Relationship status?
- Sexuality?

**Beliefs**
- Religion or beliefs?

**Important dates**
- **Important dates in your life** — repeatable: **What is it? + Date** (anniversaries, memorial dates, milestones). *(These can surface in your own Coming-up — they're your shared dates, distinct from friends' private notes about you.)*

**Anything else?**
- Anything else friends should remember? *(optional)*

Each answer asks **Who can see this?**

> Identity/beliefs fields are **sensitive**: default Close, and they are **never matchable by default** — the §11 matchable ask lists them individually rather than bulk-including them.

---

## Module 3 · Hobbies & Interests — "Select your hobbies"

*Tap anything that fits. We'll ask one quick follow-up about each one.* Rendered as the colorful chip picker (`DESIGN.md`), grouped by category, with search and a tap burst of that hobby's emoji. **+ Add your own** is always available.

**Creativity:** Acting · Animation · Blogging · Calligraphy · Creative Writing · Digital Art · Drawing · Fashion Design · Filmmaking · Graphic design · Illustration · Jewelry Making · Painting · Photography · Poetry · Pottery · Sculpting · Storytelling · Videography · Writing · Collecting
**Crafts:** DIY · Embroidery · Home Decor · Interior Design · Knitting · Quilting · Sewing · Thrifting · Woodworking
**Education:** Art History · Book club · Civic Engagement · Genealogy · History · Learning languages · Museum Visits · Philosophy · Reading
**Entertainment:** Anime · Binge-watching · Board games · Broadway · Card Games · Chess · Cosplay · Documentaries · Disney · D&D and TTRPGs · Drag · Escape Rooms · Gaming · Improv · Karaoke · Magic Tricks · Marvel · Movies · Netflix · Podcasts · Puzzles · Reality TV · Stand-up comedy · Star Wars · Thrillers · TikTok · Trivia · True crime · TV shows · Video games · YouTube
**Fitness:** Martial arts · Biking · Boxing · CrossFit · Dancing · Gym · Hiking · Yoga · Pilates · Rock climbing · Running · Surfing · Swimming · Skiing · Tennis · Volleyball · Weightlifting
**Food & Drink:** Baking · BBQ · Brunch · Coffee · Cooking · Foodie · Ice Cream · Pizza · Sushi · Tea · Wine · Beer and breweries · Cocktails · Trying restaurants · Vegan · Vegetarian
**Music:** Christian Music · DJing · EDM · Going to concerts · Guitar · Jazz · K-pop · Metal · Music Composition · Music Production · Music festivals · Musicals and theatre · Piano · Playing an instrument · Pop · Rap · Rock · Singing · Vinyl collecting
**Outdoors:** Backpacking · Beach Activities · Bird Watching · Camping · Cycling · Fishing · Foraging · Gardening · Hunting · Kayaking · Nature Exploration · Roller Skating · Sailing · Scuba diving · Snowboarding · Stargazing · Sunsets · Urban Exploring
**Social:** Activism · Astrology · Clubbing · Conservative · Debate · Environmentalism · Fashion · House Parties · LGBTQ+ Advocacy · Non-political · Personality Tests · Politics · Progressive · Spirituality · Tattoos · Volunteering
**Tech:** 3D printing · AI · App Design · Coding · Crypto · Cybersecurity · Game Streaming · NFTs · Stock Trading · Productivity · Programming · UI/UX Design · Web Design · Web3
**Wellness:** Biohacking · Cold Plunge · Crystals · Journaling · Meditation · Mental Health · Mindfulness · Saunas · Supplements · Tarot Reading · Therapy
**Sports:** Soccer · Basketball · Football · Baseball · Hockey · Pickleball · Golf · Track and field
**Animals:** Dogs · Cats · Horseback riding · Houseplants · Farming
**Travel:** Road trips · Solo travel

### Follow-ups — "Tell your friends more"

*Answer one quick question about each hobby you selected. Every answer is optional.* Each follow-up answer has its **own visibility**.

| Hobby | Follow-up |
|---|---|
| Hiking | Favorite place to hike? |
| Camping | What's the best part of camping? |
| Backpacking | What's unnecessary to pack, but you bring anyway? |
| Skiing | Where do you typically ski? |
| Snowboarding | Where do you typically snowboard? |
| Surfing | How long have you been surfing? |
| Rock climbing | Where do you climb? |
| Cycling | What's your next cycling goal? |
| Fishing | Where's your dream fishing trip? |
| Hunting | What do you like to hunt? |
| Kayaking | Favorite waterway? |
| Sailing | Who got you into sailing? |
| Scuba diving | Best dive site? |
| Stargazing | Favorite constellation? |
| Soccer / Basketball / Football / Baseball / Hockey | Who's your {sport} team? |
| Tennis | Favorite thing about tennis? |
| Pickleball | Favorite thing about pickleball? |
| Golf | Favorite course you've played? |
| Volleyball | Favorite position to play? |
| Martial arts | Which discipline? |
| Track and field | What's your event? |
| Yoga | Favorite style? |
| Pilates | What do you like about it? |
| Weightlifting | Favorite muscle to hit? |
| CrossFit | Best thing about CrossFit? |
| Boxing | What got you into boxing? |
| Swimming | Favorite stroke? |
| Meditation | What style of meditation? |
| Running | What's your next running goal? |
| Painting | What's your preferred painting style? |
| Drawing | What do you like to draw? |
| Photography | What style of photography do you shoot? |
| Videography | What video are you most proud of? |
| Pottery | Favorite thing you've made? |
| Knitting | Go-to item to knit? |
| Sewing | Favorite thing you've sewn? |
| Woodworking | Favorite thing you've built? |
| DIY | Favorite DIY project you've done? |
| Graphic design | How would you describe your design style? |
| Journaling | Where do you like to journal? |
| Collecting | What do you collect? |
| Playing an instrument | What do you play? |
| Singing | Go-to song to sing? |
| Going to concerts | Best artist you've ever seen? |
| Music festivals | Favorite festival? |
| Podcasts | Top podcast you listen to? |
| DJing | Favorite spot to DJ? |
| Vinyl collecting | Favorite vinyl you own? |
| Musicals and theatre | Favorite show you've seen? |
| Cooking | What's your signature dish? |
| Baking | What's your favorite thing to bake? |
| Trying restaurants | What restaurant do you always recommend? |
| Coffee | What's your coffee order? |
| Wine | Go-to wine? |
| Beer and breweries | Favorite brewery? |
| Cocktails | Go-to drink? |
| Tea | What's your go-to tea? |
| Movies | What movie do you always recommend? |
| TV shows | What show do you always recommend? |
| Stand-up comedy | Favorite comedian? |
| Anime | Favorite series? |
| Video games | What game are you never bored of? |
| Board games | Favorite board game? |
| D&D and TTRPGs | Longest campaign you've done? |
| Chess | What skill level are you? |
| Reading | A book you always recommend? |
| Writing | What genre do you write? |
| Book club | Favorite book you've read? |
| Coding | Best programming language, in your opinion? |
| 3D printing | Biggest thing you've printed? |
| Dogs | What kind of dog? |
| Cats | What kind of cat? |
| Horseback riding | What do you love about riding? |
| Gardening | What's in your garden? |
| Houseplants | Best type of houseplant? |
| Farming | What do you grow or raise? |
| Dancing | Where do you like to dance? |
| Karaoke | Your go-to song? |
| Volunteering | Where do you like to volunteer? |
| Thrifting | Best thrift find? |
| Fashion | How would you describe your style? |
| Tattoos | Your first tattoo? |
| Astrology | What are your big three: sun, moon, and rising? |
| Politics | How would you describe your politics? |
| Learning languages | What language are you learning? |
| History | Favorite era to study? |
| True crime | Go-to true crime podcast? |
| Road trips | What route would you do again? |
| Solo travel | Favorite place you've traveled? |
| Acting | Favorite role you have played? |
| Animation | What do you like to animate? |
| Blogging | What do you write about? |
| Calligraphy | Favorite thing to letter? |
| Creative Writing | What genre do you write? |
| Digital Art | How would you describe your style? |
| Fashion Design | What do you like to design? |
| Filmmaking | What film are you most proud of? |
| Illustration | What do you like to illustrate? |
| Jewelry Making | Favorite piece you have made? |
| Poetry | A poem you always come back to? |
| Sculpting | Favorite thing you have sculpted? |
| Storytelling | What kind of stories do you tell? |
| Embroidery | Go-to thing to stitch? |
| Home Decor | What room did you redo last? |
| Interior Design | How would you describe your style? |
| Quilting | Favorite quilt you have made? |
| Art History | Favorite period or artist? |
| Civic Engagement | What cause are you closest to? |
| Genealogy | Coolest thing you found in your family tree? |
| Museum Visits | Favorite museum? |
| Philosophy | A question you keep chewing on? |
| Binge-watching | Show you always recommend? |
| Broadway | Favorite show you have seen? |
| Card Games | Go-to card game? |
| Cosplay | Favorite costume you have made? |
| Documentaries | One that stuck with you? |
| Disney | Favorite Disney movie? |
| Drag | What do you love about drag? |
| Escape Rooms | Best room you have done? |
| Gaming | What are you playing right now? |
| Improv | Where do you like to play? |
| Magic Tricks | First trick you learned? |
| Marvel | Favorite hero? |
| Netflix | Show you always put on? |
| Puzzles | Favorite kind of puzzle? |
| Reality TV | Guilty-pleasure show? |
| Star Wars | Favorite movie or show? |
| Thrillers | One that actually got you? |
| TikTok | What do you watch there? |
| Trivia | Your strongest category? |
| YouTube | Channel you always recommend? |
| Biking | Favorite route? |
| Gym | Favorite kind of workout? |
| BBQ | Signature thing on the grill? |
| Brunch | Go-to brunch order? |
| Foodie | Restaurant you always recommend? |
| Ice Cream | Go-to flavor? |
| Pizza | Favorite topping combo? |
| Sushi | Go-to roll? |
| Vegan | Favorite vegan spot? |
| Vegetarian | Favorite vegetarian dish? |
| Christian Music | Artist you always put on? |
| EDM | Favorite festival or DJ? |
| Guitar | What do you like to play? |
| Jazz | Favorite artist or era? |
| K-pop | Bias group right now? |
| Metal | Band you always come back to? |
| Music Composition | What do you like to write? |
| Music Production | What do you like to make? |
| Piano | Piece you love to play? |
| Pop | Song you have on repeat? |
| Rap | Album you always recommend? |
| Rock | Band that got you into it? |
| Beach Activities | Favorite thing to do at the beach? |
| Bird Watching | Coolest bird you have spotted? |
| Foraging | Best thing you have found? |
| Nature Exploration | Favorite place to wander? |
| Roller Skating | Where do you like to skate? |
| Sunsets | Best sunset you have seen? |
| Urban Exploring | Favorite spot you have found? |
| Activism | What are you working toward? |
| Clubbing | Favorite night out spot? |
| Conservative | What does that mean for you? |
| Debate | Favorite topic to argue? |
| Environmentalism | What do you do about it day to day? |
| House Parties | What makes a good one? |
| LGBTQ+ Advocacy | What work matters most to you? |
| Non-political | What do you like to talk about instead? |
| Personality Tests | Your favorite result? |
| Progressive | What does that mean for you? |
| Spirituality | What practice grounds you? |
| AI | What do you like to make with it? |
| App Design | App you are most proud of? |
| Crypto | What got you into it? |
| Cybersecurity | What part of it do you love? |
| Game Streaming | What do you stream? |
| NFTs | What do you collect or make? |
| Stock Trading | What got you started? |
| Productivity | System you actually stick to? |
| Programming | Best language, in your opinion? |
| UI/UX Design | How would you describe your style? |
| Web Design | Site you are proud of? |
| Web3 | What are you building or following? |
| Biohacking | What are you trying right now? |
| Cold Plunge | How long can you stay in? |
| Crystals | Which one do you keep close? |
| Mental Health | What helps you most? |
| Mindfulness | When do you practice? |
| Saunas | Favorite spot? |
| Supplements | One you actually notice? |
| Tarot Reading | Favorite deck? |
| Therapy | What do you like about it? |
| **Custom hobby** | Tell me more about {hobby}. |

These follow-ups power the hobbies widget's tap-a-chip answers and the side-by-side answers in **In common** (`PROFILE.md`).

---

## Module 4 · Favorite Food & Drinks — "Your go-to favorites"

*Quick answers. These default to Everyone, but you can change who sees them later.* Each asks **Favorite {item}?**

**Food:** Candy · Cuisine · Ice cream flavor · Pizza flavor · Breakfast · Snack · Dessert · Fruit · Comfort food · Late-night snack
**Drinks:** Drink of choice · Coffee order

**Restaurant go-to orders — "Your usual orders":** repeatable entries — **Restaurant + What do you order there? + optional note** — with **Add another restaurant**. Each restaurant/order has its own visibility.

---

## Module 5 · Favorite Entertainment — "What you always recommend"

Each asks **Favorite {item}?** Default: Everyone.

**Movies & television:** Movie · TV show · Comfort show · Comfort movie
**Stage:** Play or musical
**Books & audio:** Book · Podcast
**Music:** Musical artist · Album · Song
**Games:** Video game · Board game
**Comedy:** Comedian

---

## Module 6 · Everyday Favorites — "A few everyday favorites"

Each asks **Favorite {item}?** Default: Everyone.

City · Place you've lived · Store to shop at · Color · Season · Holiday · Smell · Flower · Animal · Quote

---

## Module 7 · Sports Favorites — "Your sports picks"

Each asks **Favorite {item}?** Default: Everyone.

Sports team · Sport to watch · Sport to play

---

## Module 8 · This or That — "Pick your side"

*Tap one in each row. Both and neither are fair game. Skip anything you don't care about.* Answers per row: **first · second · both · neither · skip**. Skipped rows don't render on the profile; "neither" renders with both sides dimmed. Visibility: one setting for the whole module (per-answer changeable later from the profile).

**Daily rhythm:** Morning person / Night person
**Food:** Pancakes / Waffles · Pizza / Burgers · Cookies / Brownies · Spicy / Mild · Fries / Onion rings
**Nature & seasons:** Sunrise / Sunset · Spring / Fall
**Social style:** Host / Guest · Cozy night in / Night out
**Entertainment:** Movies / TV shows · Horror / Rom-com · Subtitles on / Subtitles off · Rewatch / Watch something new
**Travel:** Road trip / Flight · Window seat / Aisle seat · Sightseeing / Relaxing

Renders on the profile as the two-column rows (chosen side highlighted — `PROFILE.md`), inside **Favorites**.

---

## Module 9 · Places You've Been — "Add your places"

*Drop a pin for everywhere you have visited, lived, or want to go.*

- **Search for a place** (geocoded; the search query itself is never logged — `ANALYTICS-TAXONOMY.md`).
- For each place, choose one: **Visited · Lived there · Want to go**.
- **Optional note** — a memory, recommendation, story, or reason you want to visit.
- **Who can see this?** — per-place visibility.
- Footer: *"Photos for each place are coming soon."* (Co-op place-photos per `PROFILE.md` §9 — the footer shows until that ships/for free users.)

"Want to go" entries can also feed **Goals/Bucket list** ("travel before I die") when the person opts to copy them over.

---

## Data & analytics

- Every answer = one `attributes` row: `{ key, value, visibleToTier, matchable }`; repeatables (family members, restaurants, places, dates) are one row each.
- Module ids for analytics (`module_started/completed`, `module_item_added`): `about_basics`, `about_deeper`, `hobbies`, `food_drinks`, `entertainment`, `everyday`, `sports`, `this_or_that`, `places`, `top5`, `obsession`, `timeline`, `recommendations`, `goals`. Never log answer text.
- Sensitive fields (Module 2 identity/beliefs) are excluded from bulk-matchable and listed individually in the consent step.

## Acceptance criteria

- [ ] The module menu shows all 14 as cards with description, time estimate, answered count, Continue/Edit, and a live preview.
- [ ] Modules 1–9 contain exactly the questions above; all optional; save/resume; cancel-saves-nothing.
- [ ] Birthday pre-fills from onboarding; zodiac sun auto-guesses from it (with the no-birthday empty state).
- [ ] Family and sibling-order support repeatable entries with drag-to-reorder.
- [ ] Every hobby (including custom) has its follow-up; each follow-up answer carries its own visibility.
- [ ] Restaurants/orders and important dates are repeatable with per-entry visibility.
- [ ] This-or-that supports first/second/both/neither/skip; skip doesn't render; module-level visibility with later per-answer override.
- [ ] Places entries carry Visited/Lived/Want-to-go + note + per-place visibility; place-search queries are never logged.
- [ ] Every module ends with Who-sees (set-all + overrides, defaults per the menu table) then the separate matchable consent; Module 2 sensitive fields are never bulk-matchable.
