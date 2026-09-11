# Bridger Profile - Designer Brief

This document explains the Profile page in **simple English**. Please translate anything you need into your own language. The writing is detailed on purpose, so there is less room for confusion.

**Goal:** Redesign the profile so it feels like a personal **biography** and **photo album**. It must also stay easy to use on a phone.

## Quick facts

These numbers are only a snapshot of the current content bank. They help you understand the size of the job.

| Item | Detail |
| --- | --- |
| North star | Living biography / photo album / printable book someday |
| Useful structure reference | Spotify-like categorization for many modules (blend, not replace) |
| Must work on | Mobile first, easy to navigate |
| Question modules | 14 |
| Hobby options | 196 (each with emoji + follow-up) |
| This-or-That pairs | 17 |
| Main tabs | 4 |

---

## Please read this first

### North star (please read carefully)

The profile should feel like a **living biography** of a real person. It should also feel like a **photo album**. The emotional goal is that a friend can open the page and understand who this person is, what they love, where they have been, and what they hope for.

One day, Bridger wants to be able to turn this same content into a **printable book about yourself**. That future idea matters now, because it means the content should stay rich, ordered, and complete. Today, the same content must still feel calm on a small phone screen. Do not design something that only works as a desktop magazine layout.

Spotify is still useful as a **structure reference**, even though biography is the emotional north star. Spotify is good at putting many different kinds of content on one page in clear groups. Clear sections, album-like modules, lists, search, and a sticky header help people browse a large page without getting lost. People already understand that browsing pattern.

So this redesign can be a blend. The feeling and story should be biography and photo album. The browsing system can still borrow Spotify strengths for categorizing many pieces of content. The founder is **not sure of the exact mix yet**. Please propose options that keep biography as the heart, while using Spotify-like grouping where it makes a large page easier to scan.

| Layer | Direction |
| --- | --- |
| Feeling / story | Biography + photo album + printable book someday |
| Structure / browsing | Spotify-like ways to group and scan lots of elements |

### Think of the profile like…

Use these metaphors while you design. They are not literal UI labels. They explain the feeling and the job of the page.

| Metaphor | Design meaning |
| --- | --- |
| A photo album | Photos and visual covers matter. Sections feel like pages, not a long form. |
| A short biography book | Each section is a chapter of a life. |
| A printable book one day | Rich ordered content. Custom looks change style, not delete facts. |
| A well-organized music app page | Useful for grouping many modules (Favorites albums, lists, map). |
| A phone app today | Easy scroll, big taps, clear titles, Search on the page. |

---

## Filling out questions (very important)

There are many questions across the profile modules. That is okay only if filling them out feels light and friendly. People should never feel trapped in a long exam.

A person should be able to fill one question or one module at a time. They should also be able to fill many modules in one sitting if they feel like it. They must be able to save and come back later. They must be able to edit answers later from the profile or biography page. If they cancel a module attempt, that unfinished attempt should save nothing. The flow should gently help them answer as many questions as they want, without pressure.

Do not overwhelm people with progress like **1/30** or "question 4 of 40". Those counters make people guess how long the work will take, and many people quit. Prefer time language instead, such as "About 5 minutes" or "About 2 minutes" or "Quick picks - under 3 minutes". Show a minutes estimate on the module card before they start. Let them skip or continue later easily. Show what is already done versus not started without scary fractions. Celebrate progress with calm language, such as "3 chapters started".

| Allowed way | Detail |
| --- | --- |
| One at a time | One question or one module |
| Many at once | Several modules in one sitting if they want |
| Save and return | Come back later anytime |
| Edit later | Change answers from the profile / biography page |
| Cancel | Saves nothing for that unfinished attempt |
| Gentle help | Flow helps them answer as many as they want, without pressure |

| Avoid | Prefer instead |
| --- | --- |
| 1/30 | About 5 minutes |
| Question 4 of 40 | About 2 minutes |
| Long unmarked quiz | Quick picks - under 3 minutes |
| Scary fraction counters | 2 to 5 minutes |

---

## Important design rules (please follow)

These rules reduce confusion between product, privacy, and visual design. Please follow them unless we later change them together.

| Rule | Simple meaning |
| --- | --- |
| Favorites covers look visual | Not a big emoji alone. Use photo / illustration / strong visual tile. |
| This or That ≠ Favorites | Favorites = write answers. This or That = tap left or right. |
| Upcoming events only if invited | Hide whole section if viewer was not invited. |
| Polls / weekly recap optional | Show only when they exist. |
| Modules can grow later | New chapters without breaking the book feeling. |
| Custom look ≠ hide life story | Style and order can change. Facts cannot be deleted by styling. View original always. |
| Who can see what | Close / Friends / Everyone. Sensitive defaults to Close. |
| Filling feels light | Minutes estimates, save/resume, edit later. Avoid 1/30 counters. |

---

## Biography page also includes: Inside jokes, Bucket list, and Notes

The biography page is not only About Me, Favorites, and the map. It also includes relationship and memory pieces that make the page feel alive. Inside jokes capture shared humor. Bucket list captures future dreams. Custom notes capture what **you** know about a friend, even before that friend joins Bridger.

| Part | Purpose | Key behaviors |
| --- | --- | --- |
| Inside jokes | Shared humor and memory | Sticky-note wall; filter All / About you / By you; add joke + who + where |
| Bucket list | Dreams and future wants | Solo or friend-tagged; public/private; check off; friend page shows public only |
| Custom notes | Remember things about a friend (even before they join) | Private to you; 3 types; merge when they join (open design) |

### Custom notes (CRITICAL - please design carefully)

Custom notes are one of the most important relationship tools in Bridger. Their purpose is to help you remember things about a friend. You should be able to do this even before the friend joins Bridger, and you should still be able to do this after they join.

In plain words, you should be able to build a limited "about them" biography for someone using your own notes. Examples include their favorite movie, their hometown, their parents' names, soft reminders to check in, and important dates in their life. These notes belong to you. The friend does not see your private notes.

There are three note types. A plain note stores a fact. A follow-up or check-in reminder nudges you to reach out later. A date reminder stores a date that matters and can remind you on Home about one week before and on the day.

| Type | What it is | Example |
| --- | --- | --- |
| Plain note | Remember a fact | "loves obscure horror", "mom's name is Ana" |
| Follow-up / check-in reminder | Nudge yourself to reach out later | "check in every month" |
| Date reminder | A date that matters; remind on Home ~1 week before + day-of | "graduation · May 5" |

#### Open design problem: notes before they join + merge after they join

**Founder is not certain of the exact UX yet. Please treat this as an open design question and propose options.**

Here is the desired story in simple steps. First, if my friend is not on Bridger yet, I can still create a limited profile or biography for them by writing notes and favorite facts. Second, later my friend joins Bridger and creates their own real profile with their own answers. Third, I do not want two separate profiles floating around forever. Fourth, I want a merge or connect feeling. My private notes should stay private and easy for me to find. Their real answers should become the shared biography. My notes should stay connected to their profile so I can still look through what I know about them. Fifth, if I wrote "favorite movie = X" as a note, and they later answer Favorite Movie themselves, the design should make that relationship clear without creating duplicate confusing cards.

| Step | Desired feeling |
| --- | --- |
| 1. Friend not on Bridger yet | I can build a limited biography for them with notes / favorite facts |
| 2. Friend joins Bridger | They create their own real profile answers |
| 3. After join | I do not want two separate profiles forever |
| 4. Merge / connect | My notes stay private + easy to find; their answers become the shared biography; notes stay linked to their profile |
| 5. Same topic both exist | If I noted favorite movie = X and they later answer Favorite Movie, show clear relationship without duplicate confusing cards |

Where notes live is also open. One option is a separate Notes area on the friend biography page. Another option is notes attached inside chapters, such as Entertainment or About them. Another option is a mix, where notes can pin to a chapter and also appear in one Notes inbox. After they join, one useful pattern is showing Their answer next to Your private note for the same topic when both exist.

| Option | Idea | Pros to explore |
| --- | --- | --- |
| A | Separate Notes area on friend biography | One inbox for everything I know |
| B | Notes attached inside chapters (Entertainment, About them, etc.) | Notes live next to the topic |
| C | Mix: pin to chapter + also appear in Notes inbox | Best of both? |
| D | After join: Their answer next to Your private note for same topic | Makes merge visible |

Please propose a clear recommendation. The founder wants merge and no double-profile confusion, but is unsure whether Notes should be a separate section or woven into chapters.

Privacy for notes must stay clear. Notes are author-only, so only you see them. Never show your private notes on their shared card to other people. When they join, their answers are theirs, and your notes remain yours.

| Rule | Meaning |
| --- | --- |
| Author-only | Only you see your notes |
| Not on shared card | Never show your private notes to other people |
| After they join | Their answers are theirs; your notes remain yours |

---

## Page map - each chapter and its purpose

This section explains what sits on the biography page and why each part exists. Read the purpose paragraph for each chapter, then use the tables for exact structure.

### Top of page (always there)

The top of the page should instantly show who this person is. It also gives the main controls to explore or edit. This top area is the navigation spine. It should stay recognizable even when someone customizes colors or layout.

| Element | Notes |
| --- | --- |
| Full-bleed header photo | Banner photo |
| Name | Pixel / display name |
| City | Under the name |
| Story tile | Current update |
| Friend level or View as | Friend page vs own page |
| Search | Find things on this profile |
| Edit + Settings | Own page only |
| Play recap | Only if a recap exists |

### Tabs

Tabs divide the biography into major areas. Your own page and a friend page share the same spirit, but the tab labels differ where the jobs differ.

| Whose page | Tabs |
| --- | --- |
| Your own | Profile · Stories · Inside jokes · Bucket list |
| Friend | About them · In common · Inside jokes · Bucket list |

### Profile tab chapters (suggested biography order)

The Profile tab is the main scrollable biography. The order below is a suggested native order. Custom layouts may reorder movable chapters later, but the meaning of each chapter should stay clear.

| Chapter | Purpose | Show when | What it is |
| --- | --- | --- | --- |
| Mutuals | Show friendship overlap; feel connected | You share friends | Row of people you both know |
| Top 5 | Fastest way to "get" someone; signature identity | They filled it | Up to 5 short lines (optional image per line) |
| About me | Opening of the biography: bio + life facts | They filled it | Bio + photo + facts grid |
| Current Obsession | Who they are TODAY, not years ago | They filled it | Photo/picture squares: Reading, Building, Training… |
| Favorites | Deep tastes as photo-album chapters | They filled modules | Food / Entertainment / Everyday / Sports as visual album tiles (not emoji covers) |
| This or That | Quick personality without typing | They answered | Two-option taps (not a written favorites list) |
| Hobbies | What they enjoy + one personal detail each | They picked hobbies | Color chips + follow-ups; swipe chips ↔ answers |
| Places (MAP + PHOTOS) | Travel / life geography as a visual chapter | They added places | World map with pins + photos per place + list view |
| Where you met | Start of this friendship | Friend page + saved | Short place + how you met |
| Upcoming events | Shared plans that matter to the viewer | ONLY if viewer invited | Shared events; hide section if none |
| Polls (optional) | Participate in a live question | ONLY if open poll exists | Poll card on profile |
| Weekly recap (optional) | Play a weekly story moment | ONLY if recap exists | Play control |
| Greatest hits | Visual photo plates between chapters | Co-op, up to 3 | Large photos between sections |

### Places you have been (extra detail)

Places is a special chapter because it is visual and geographic. The main experience should be a world map with pins. Friends should explore by tapping pins, not by reading a long form. Each place can have a short note and photos. Photos belong to that pin, so the place feels like a travel album page inside the biography. There should also be a simple list view of the same places for people who prefer lists. Each place can be tagged Visited, Lived there, or Want to go. If you and a friend have both been somewhere, shared place photos can appear in In common.

| Feature | Detail |
| --- | --- |
| Main view | World map with pins |
| Tap a pin | Place + note + photos |
| Secondary view | Simple list of the same places |
| Place tags | Visited / Lived there / Want to go |
| Optional note | Memory, tip, or why they want to go |
| Photos | People can add photos to each place (photos belong to that pin) |
| In common | If both visited a place, shared photos can appear in In common |
| Feel | Opening a map inside a photo book, not filling a form |

---

## This or That (special: tap, do not type)

This or That exists to show personality with almost no effort. It is a tap game, not a typed list. This is different from Favorites. Favorites ask people to write answers such as Favorite movie. This or That shows two choices side by side, such as Pancakes or Waffles. On the profile, it should look like a playful two-column picker, not another album of text fields.

For each row, a person can choose the first option, the second option, both, neither, or skip. Skip does not show on the profile. Neither shows both sides dimmed.

| Favorites | This or That |
| --- | --- |
| Write answers (Favorite movie?) | Choose left or right (Pancakes or Waffles) |
| Looks like album / list chapters | Looks like playful two-column picker |

| Answer | What happens on profile |
| --- | --- |
| First option | Shows that side |
| Second option | Shows that side |
| Both | Shows both |
| Neither | Both sides dimmed |
| Skip | Does not show on profile |

### All pairs

| Group | Option A | Option B |
| --- | --- | --- |
| Daily rhythm | Morning person | Night person |
| Food | Pancakes | Waffles |
| Food | Pizza | Burgers |
| Food | Cookies | Brownies |
| Food | Spicy | Mild |
| Food | Fries | Onion rings |
| Nature | Sunrise | Sunset |
| Nature | Spring | Fall |
| Social | Host | Guest |
| Social | Cozy night in | Night out |
| Entertainment | Movies | TV shows |
| Entertainment | Horror | Rom-com |
| Entertainment | Subtitles on | Subtitles off |
| Entertainment | Rewatch | Watch something new |
| Travel | Road trip | Flight |
| Travel | Window seat | Aisle seat |
| Travel | Sightseeing | Relaxing |

---

## Favorites modules (visual album covers + exact questions)

Favorites collect the small tastes that make someone feel known. Food, entertainment, everyday life, and sports should feel like chapters in a photo album. Each Favorites module should look like an album cover or photo-book cover. Use a real photo, a strong illustration, or another captivating visual tile. Do not use a big emoji alone as the main cover. When someone opens a module, they answer the questions one by one.

| Visual rule | Detail |
| --- | --- |
| Cover style | Photo, illustration, or strong visual tile |
| Do not | Use a big emoji alone as the main cover |
| Open behavior | Questions asked one by one |

### Food & Drinks

This module captures go-to food and drink tastes. Each item asks Favorite {item}. There is also a repeatable restaurant go-to, because usual orders are very useful friendship knowledge.

| # | Question item |
| --- | --- |
| 1 | Candy |
| 2 | Cuisine |
| 3 | Ice cream flavor |
| 4 | Pizza flavor |
| 5 | Breakfast |
| 6 | Snack |
| 7 | Dessert |
| 8 | Fruit |
| 9 | Comfort food |
| 10 | Late-night snack |
| 11 | Drink of choice |
| 12 | Coffee order |

| Restaurant field | Required? |
| --- | --- |
| Restaurant name | Yes |
| What do you order there? | Yes |
| Optional note | No |
| Add another restaurant | Allowed |

### Entertainment

This module captures what someone watches, reads, listens to, and recommends. These answers are conversation starters and gift ideas.

| # | Question |
| --- | --- |
| 1 | Favorite movie? |
| 2 | Favorite TV show? |
| 3 | Favorite comfort show? |
| 4 | Favorite comfort movie? |
| 5 | Favorite play or musical? |
| 6 | Favorite book? |
| 7 | Favorite podcast? |
| 8 | Favorite musical artist? |
| 9 | Favorite album? |
| 10 | Favorite song? |
| 11 | Favorite video game? |
| 12 | Favorite board game? |
| 13 | Favorite comedian? |

### Everyday Favorites

This module captures small everyday tastes that still say a lot about a person.

| # | Question |
| --- | --- |
| 1 | Favorite city? |
| 2 | Favorite place you have lived? |
| 3 | Favorite store to shop at? |
| 4 | Favorite color? |
| 5 | Favorite season? |
| 6 | Favorite holiday? |
| 7 | Favorite smell? |
| 8 | Favorite flower? |
| 9 | Favorite animal? |
| 10 | Favorite quote? |

### Sports Favorites

This module is short on purpose. It captures teams and sports identity without needing a huge form.

| # | Question |
| --- | --- |
| 1 | Favorite sports team? |
| 2 | Favorite sport to watch? |
| 3 | Favorite sport to play? |

---

## Hobbies (196 options + emoji + follow-up question)

Hobbies show what someone enjoys doing. The person taps hobbies that fit. For each selected hobby, Bridger asks one short follow-up question. Follow-up answers are optional. A custom hobby is always allowed with Add your own. The custom follow-up is Tell me more about {hobby}.

On the profile, hobbies should appear as colorful chips. Tapping a chip shows the follow-up answer. There is also a swipe view that lists every hobby and answer. The last view a person used can become the default next time.

| Behavior | Detail |
| --- | --- |
| Select | Tap hobbies they like |
| Follow-up | One short optional question per selected hobby |
| Custom hobby | Always allowed (+ Add your own) |
| Custom follow-up | Tell me more about {hobby} |
| On profile | Colorful chips; tap chip to see answer |
| Second view | Swipe to list every hobby + answer |

### Hobby list by category

The tables below are the full hobby bank. Use them when designing the picker and the profile chips. Each row is one hobby, its emoji, and its exact follow-up question.

#### Creativity (21)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Acting | 🎭 | Favorite role you have played? |
| Animation | 🎬 | What do you like to animate? |
| Blogging | ✍️ | What do you write about? |
| Calligraphy | ✒️ | Favorite thing to letter? |
| Creative Writing | ✒️ | What genre do you write? |
| Digital Art | 🖌️ | How would you describe your style? |
| Drawing | ✏️ | What do you like to draw? |
| Fashion Design | 👗 | What do you like to design? |
| Filmmaking | 🎬 | What film are you most proud of? |
| Graphic design | 🖼️ | How would you describe your design style? |
| Illustration | ✏️ | What do you like to illustrate? |
| Jewelry Making | 💍 | Favorite piece you have made? |
| Painting | 🎨 | What's your preferred painting style? |
| Photography | 📷 | What style of photography do you shoot? |
| Poetry | 📝 | A poem you always come back to? |
| Pottery | 🏺 | Favorite thing you have made? |
| Sculpting | ✨ | Favorite thing you have sculpted? |
| Storytelling | 📚 | What kind of stories do you tell? |
| Videography | 🎥 | What video are you most proud of? |
| Writing | ✍️ | What genre do you write? |
| Collecting | 🗂 | What do you collect? |

#### Crafts (9)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| DIY | 🛠️ | Favorite DIY project you've done? |
| Embroidery | 🧶 | Go-to thing to stitch? |
| Home Decor | 🏡 | What room did you redo last? |
| Interior Design | 🪑 | How would you describe your style? |
| Knitting | 🧶 | Go-to item to knit? |
| Quilting | 🧵 | Favorite quilt you have made? |
| Sewing | 🧵 | Favorite thing you've sewn? |
| Thrifting | 🛍 | Best thrift find? |
| Woodworking | 🪵 | Favorite thing you've built? |

#### Education (9)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Art History | 🖼️ | Favorite period or artist? |
| Book club | 📚 | Favorite book you've read? |
| Civic Engagement | 🏛️ | What cause are you closest to? |
| Genealogy | 🧬 | Coolest thing you found in your family tree? |
| History | 📜 | Favorite era to study? |
| Learning languages | 🗣️ | What language are you learning? |
| Museum Visits | 🏛️ | Favorite museum? |
| Philosophy | 🧠 | A question you keep chewing on? |
| Reading | 📖 | A book you always recommend? |

#### Entertainment (31)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Anime | 🎌 | Favorite series? |
| Binge-watching | 📺 | Show you always recommend? |
| Board games | 🎲 | Favorite board game? |
| Broadway | 🎭 | Favorite show you have seen? |
| Card Games | 🃏 | Go-to card game? |
| Chess | ♟️ | What skill level are you? |
| Cosplay | 🧝 | Favorite costume you have made? |
| Documentaries | 🎬 | One that stuck with you? |
| Disney | 🏰 | Favorite Disney movie? |
| D and D and TTRPGs | 🎲 | Longest campaign you've done? |
| Drag | 👠 | What do you love about drag? |
| Escape Rooms | 🚪 | Best room you have done? |
| Gaming | 🎮 | What are you playing right now? |
| Improv | 🎭 | Where do you like to play? |
| Karaoke | 🎤 | Your go-to song? |
| Magic Tricks | 🎩 | First trick you learned? |
| Marvel | 🦸 | Favorite hero? |
| Movies | 🎬 | What movie do you always recommend? |
| Netflix | 📺 | Show you always put on? |
| Podcasts | 🎧 | Top podcast you listen to? |
| Puzzles | 🧩 | Favorite kind of puzzle? |
| Reality TV | 📸 | Guilty-pleasure show? |
| Stand up comedy | 🎤 | Favorite comedian? |
| Star Wars | 🚀 | Favorite movie or show? |
| Thrillers | 🔪 | One that actually got you? |
| TikTok | 📱 | What do you watch there? |
| Trivia | 🎲 | Your strongest category? |
| True crime | 🕵️ | Go-to true crime podcast? |
| TV shows | 📺 | Show you always recommend? |
| Video games | 🕹️ | What game are you never bored of? |
| YouTube | ▶️ | Channel you always recommend? |

#### Fitness (17)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Martial arts | 🤸 | Which discipline? |
| Biking | 🚴 | Favorite route? |
| Boxing | 🥊 | What got you into boxing? |
| CrossFit | 🔥 | Best thing about CrossFit? |
| Dancing | 💃 | Where do you like to dance? |
| Gym | 💪 | Favorite kind of workout? |
| Hiking | 🥾 | Favorite place to hike? |
| Yoga | 🧘 | Favorite style? |
| Pilates | 🧘‍♀️ | What do you like about it? |
| Rock climbing | 🧗 | Where do you climb? |
| Running | 🏃 | What's your next running goal? |
| Surfing | 🏄 | How long have you been surfing? |
| Swimming | 🏊 | Favorite stroke? |
| Skiing | ⛷️ | Where do you typically ski? |
| Tennis | 🎾 | Favorite thing about tennis? |
| Volleyball | 🏐 | Favorite position to play? |
| Weightlifting | 🏋️ | Favorite muscle to hit? |

#### Food & Drink (16)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Baking | 🧁 | What's your favorite thing to bake? |
| BBQ | 🍖 | Signature thing on the grill? |
| Brunch | 🍳 | Go-to brunch order? |
| Coffee | ☕️ | What's your coffee order? |
| Cooking | 🧑‍🍳 | What's your signature dish? |
| Foodie | 🍽️ | Restaurant you always recommend? |
| Ice Cream | 🍦 | Go-to flavor? |
| Pizza | 🍕 | Favorite topping combo? |
| Sushi | 🍣 | Go-to roll? |
| Tea | 🍵 | What's your go-to tea? |
| Wine | 🍷 | Go-to wine? |
| Beer and breweries | 🍺 | Favorite brewery? |
| Cocktails | 🍸 | Go-to drink? |
| Trying restaurants | 🍽 | Restaurant you always recommend? |
| Vegan | 🥗 | Favorite vegan spot? |
| Vegetarian | 🥗 | Favorite vegetarian dish? |

#### Music (19)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Christian Music | 🎶 | Artist you always put on? |
| DJing | 🎧 | Favorite spot to DJ? |
| EDM | 🎚️ | Favorite festival or DJ? |
| Going to concerts | 🎟 | Best artist you've ever seen? |
| Guitar | 🎸 | What do you like to play? |
| Jazz | 🎷 | Favorite artist or era? |
| K-pop | 🎤 | Bias group right now? |
| Metal | 🤘 | Band you always come back to? |
| Music Composition | 🎹 | What do you like to write? |
| Music Production | 🎹 | What do you like to make? |
| Music festivals | 🎪 | Favorite festival? |
| Musicals and theatre | 🎭 | Favorite show you've seen? |
| Piano | 🎹 | Piece you love to play? |
| Playing an instrument | 🎸 | What do you play? |
| Pop | 🎤 | Song you have on repeat? |
| Rap | 🎤 | Album you always recommend? |
| Rock | 🎸 | Band that got you into it? |
| Singing | 🎶 | Go-to song to sing? |
| Vinyl collecting | 📀 | Favorite vinyl you own? |

#### Outdoors (18)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Backpacking | 🎒 | What's unnecessary to pack but you bring anyway? |
| Beach Activities | 🏖️ | Favorite thing to do at the beach? |
| Bird Watching | 🐦 | Coolest bird you have spotted? |
| Camping | 🏕️ | What's the best part of camping? |
| Cycling | 🚴 | What's your next cycling goal? |
| Fishing | 🎣 | Where's your dream fishing trip? |
| Foraging | 🌿 | Best thing you have found? |
| Gardening | 🪴 | What's in your garden? |
| Hunting | 🦌 | What do you like to hunt? |
| Kayaking | 🛶 | Favorite waterway? |
| Nature Exploration | 🔭 | Favorite place to wander? |
| Roller Skating | 🛼 | Where do you like to skate? |
| Sailing | ⛵️ | Who got you into sailing? |
| Scuba diving | 🤿 | Best dive site? |
| Snowboarding | 🏂 | Where do you typically snowboard? |
| Stargazing | 🌌 | Favorite constellation? |
| Sunsets | 🌅 | Best sunset you have seen? |
| Urban Exploring | 🏙️ | Favorite spot you have found? |

#### Social (16)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Activism | ✊ | What are you working toward? |
| Astrology | 🌠 | Your big three (sun, moon, star)? |
| Clubbing | 🥳 | Favorite night out spot? |
| Conservative | 🐘 | What does that mean for you? |
| Debate | 💬 | Favorite topic to argue? |
| Environmentalism | ♻️ | What do you do about it day to day? |
| Fashion | 👗 | How would you describe your style? |
| House Parties | 🎉 | What makes a good one? |
| LGBTQ+ Advocacy | 🏳️‍🌈 | What work matters most to you? |
| Non-political | 🗳️ | What do you like to talk about instead? |
| Personality Tests | ✨ | Your favorite result? |
| Politics | 🏛 | How would you describe your politics? |
| Progressive | 🫏 | What does that mean for you? |
| Spirituality | 🙏 | What practice grounds you? |
| Tattoos | 🖋 | Your first tattoo? |
| Volunteering | 🙌 | Where do you like to volunteer? |

#### Tech (14)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| 3D printing | 🖨 | Biggest thing you've printed? |
| AI | 🤖 | What do you like to make with it? |
| App Design | 📱 | App you are most proud of? |
| Coding | 💻 | Best language, in your opinion? |
| Crypto | 💰 | What got you into it? |
| Cybersecurity | 🛡️ | What part of it do you love? |
| Game Streaming | 📺 | What do you stream? |
| NFTs | 🖼️ | What do you collect or make? |
| Stock Trading | 📈 | What got you started? |
| Productivity | 📅 | System you actually stick to? |
| Programming | 💻 | Best language, in your opinion? |
| UI/UX Design | 🎨 | How would you describe your style? |
| Web Design | 🌐 | Site you are proud of? |
| Web3 | 🌐 | What are you building or following? |

#### Wellness (11)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Biohacking | 🧬 | What are you trying right now? |
| Cold Plunge | ❄️ | How long can you stay in? |
| Crystals | 🔮 | Which one do you keep close? |
| Journaling | 📔 | Where do you like to journal? |
| Meditation | 🧘 | What style of meditation? |
| Mental Health | 💚 | What helps you most? |
| Mindfulness | 🕊️ | When do you practice? |
| Saunas | 🔥 | Favorite spot? |
| Supplements | 💊 | One you actually notice? |
| Tarot Reading | 🃏 | Favorite deck? |
| Therapy | 🛋️ | What do you like about it? |

#### Sports (8)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Soccer | ⚽️ | Who's your soccer team? |
| Basketball | 🏀 | Who's your basketball team? |
| Football | 🏈 | Who's your football team? |
| Baseball | ⚾️ | Who's your baseball team? |
| Hockey | 🏒 | Who's your hockey team? |
| Pickleball | 🏓 | Favorite thing about pickleball? |
| Golf | ⛳️ | Favorite course you've played? |
| Track and Field | 🏃 | What's your event? |

#### Animals (5)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Dogs | 🐕 | What kind of dog? |
| Cats | 🐈 | What kind of cat? |
| Horseback riding | 🐴 | What do you love about riding? |
| Houseplants | 🪴 | Best type of houseplant? |
| Farming | 🚜 | What do you grow or raise? |

#### Travel (2)

| Hobby | Emoji | Follow-up question |
| --- | --- | --- |
| Road trips | 🚗 | Route you'd do again? |
| Solo travel | ✈️ | Favorite place you've traveled? |

---

## All other modules - purpose + exact questions

These modules fill the rest of the biography. Every module should feel optional, resumable, and easy to edit later. Each module ends with who-can-see settings and a separate Discover matching yes or no.

### About Me Basics

About Me Basics is the simple stuff friends usually ask first. It includes birthday, nicknames, pronouns, hometown, current town, school, work, pets, allergies, and zodiac. Birthday can come from onboarding and then be confirmed or updated. Zodiac Sun can auto-fill from birthday.

| Question | Notes |
| --- | --- |
| When is your birthday? | From onboarding; confirm or update |
| Any nicknames? | Optional |
| What pronouns do you use? | Optional |
| Where are you from? | Hometown |
| What town do you live in now? | Current city |
| Where did you go to high school? | Optional |
| Where did you go to college? | Optional |
| What did you study? | Optional |
| What is your current job title? | Optional |
| What is your dream job? | Optional |
| Any food allergies? | Also helps events |
| Any dietary restrictions? | Optional |
| What pets do you have? | Type or breed |
| What are your pets' names? | Optional |
| What is your zodiac? (Sun / Moon / Rising) | Sun can auto-fill from birthday |

### About Me Deeper (more private)

About Me Deeper is for personal details closer friends should remember. The default audience is Close friends. Sensitive fields such as heritage, relationship, sexuality, and beliefs are not bulk-matchable for Discover.

| Question | Notes |
| --- | --- |
| What is your middle name? | Default Close |
| Who is in your family? | Repeatable: Name + Relation; drag to reorder |
| Where do you fall in line? | Add siblings + yourself; drag oldest to youngest |
| Ethnicity or heritage? | Sensitive; not bulk-matchable |
| Relationship status? | Sensitive |
| Sexuality? | Sensitive |
| Religion or beliefs? | Sensitive |
| Important dates in your life? | Repeatable: What is it? + Date |
| Anything else friends should remember? | Free text |

### Top 5

Top 5 is the signature identity chapter. It asks for five things anyone who knows you well needs to know. Each line can have an optional small image or emoji. The list is reorderable. This chapter should sit high because it is the fastest way to understand someone.

| Item | Detail |
| --- | --- |
| Prompt | 5 things anyone who knows you well needs to know |
| Entries | Thing 1 through Thing 5 |
| Extras | Optional small image or emoji per line |
| Order | Reorderable |

### Current Obsession (who you are today)

Current Obsession keeps the biography fresh. It answers who this person is today, not five years ago. Each square can use a photo or picture. Prefer photos when possible.

| # | Prompt |
| --- | --- |
| 1 | Reading… |
| 2 | Watching… |
| 3 | Listening… |
| 4 | Obsessed with… |
| 5 | Working on… |
| 6 | Traveling to… |
| 7 | Training for… |
| 8 | Currently watching… |
| 9 | Building: |
| 10 | Writing: |
| 11 | Learning: |
| 12 | Launching: |

### Places You Have Been (map + photos)

This is the fill flow for the Places chapter. Search for a place, choose Visited or Lived there or Want to go, optionally add a note, add photos to the place, and choose who can see it.

| Step | Question / choice |
| --- | --- |
| 1 | Where have you been? (search a place) |
| 2 | Visited / Lived there / Want to go |
| 3 | Any note about this place? (optional) |
| 4 | Add photos to this place |
| 5 | Who can see this place? |

### Life Timeline

Life Timeline is the longer arc of a life. It includes education, jobs, cities, and defining moments. Moments should feel like things that made the person, not a job CV.

| Question | Example direction |
| --- | --- |
| A school or education moment? | School chapter |
| A job that shaped you? | Work chapter |
| A city that mattered? | Place chapter |
| A defining moment (not a CV brag)? | Started a nonprofit / Climbed Kilimanjaro / Built an app / Published a book / Ran a marathon |

### Recommendations

Recommendations are things this person thinks others have to try. Each recommendation can include an optional note.

| # | Question |
| --- | --- |
| 1 | Recommend a book? |
| 2 | Recommend a movie? |
| 3 | Recommend a restaurant? |
| 4 | Recommend a game? |
| 5 | Recommend music? |
| 6 | Recommend a podcast? |

### Goals (feeds Bucket List)

Goals capture big wants and dreams. These can become Bucket List items later.

| # | Question |
| --- | --- |
| 1 | A big goal or place you want to go? |
| 2 | Another goal? |

### End of every module

Every module ends the same way. First, choose who can see the answers. Second, choose whether these answers can help Discover matching. These two choices are separate.

| Step | What happens |
| --- | --- |
| 1. Who can see this? | Close / Friends / Everyone + per-item changes |
| 2. Use for Discover matching? | Yes / No (separate from who can see) |

---

## Other tabs (also part of the biography)

These tabs are part of the same biography world. Stories are time-ordered memories. Inside jokes are shared humor. Bucket list is future dreams. In common is the overlap between two people.

| Tab | Purpose | Key details |
| --- | --- | --- |
| Stories (own) | Time-ordered memory of updates | Calendar; tap a day to play; like flipping photo-album pages |
| Inside jokes | Shared humor glue | Sticky notes; All / About you / By you; joke + who + where |
| Bucket list | Future dreams chapter | Solo or tagged; public/private; check off; friend sees public only |
| In common (friend) | Overlapping chapters of two biographies | Shared hobbies (both answers), This or That, places + photos, quiz overlap |

---

## Custom look (MySpace energy, still readable)

People should be able to decorate their biography like a scrapbook. The page should feel personal. At the same time, friends must still find chapters easily. Customization can change colors, backgrounds, fonts, and the order of movable chapters. Customization must not hide or delete real life facts. Header and tabs stay anchored. View original must always be one tap away.

| Allowed | Not allowed |
| --- | --- |
| Change colors, background, fonts (co-op) | Hide or delete real life facts with styling |
| Reorder movable chapters | Move or cover the header and tab bar |
| Add up to 3 Greatest hits photos | Cover View original, report, or block |
| Later: safe custom CSS (no scripts) | Tracking pixels, outside images, JavaScript |

---

## What success looks like

Use this checklist when reviewing design options.

| Success check | Yes if… |
| --- | --- |
| Biography first | Feels like a visual life story |
| Browse many modules | Spotify-like grouping helps without replacing biography |
| Light fill flow | Minutes estimates, not scary 1/30 counters |
| Flexible pace | Do a little or a lot; edit later |
| Places chapter | Map + photos feel like a travel album |
| Jokes / Bucket / Notes | Clearly part of the biography world |
| Notes merge | Works before join; merges cleanly after join; no double-profile confusion |
| Open Notes UX | Designer proposes placement + merge recommendation |

---

## How to share this file

You can copy all text from this page, paste into Google Docs or Notion or email, or send the Markdown file as an attachment.

---

*Source of questions and hobby emoji: apps/mobile/data/fixtures/profile-questions.ts and guide-docs PROFILE.md / PROFILE-MODULES.md.*
