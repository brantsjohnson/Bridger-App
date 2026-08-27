import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CustomWidget,
  PROFILE_PRESETS,
  ProfileTheme } from
'../../../../packages/shared';
import {
  FloatingTabBar,
  MessagesLinkProvider,
  ProfileLinkProvider,
  TabKey,
  screenTransition } from
'../../../../packages/ui';
import { HomeScreen } from './home';
import { EventsScreen } from './events';
import { DiscoverScreen } from './discover';
import { FriendsScreen } from './friends';
import { CustomizeProfileScreen } from '../profile/customize';
import { ProfileScreen } from './profile';
import { NotificationsScreen } from '../notifications';
import { EventDetailScreen } from '../event/detail';
import { EventHostScreen } from '../event/host';
import { PersonScreen } from '../person';
import { StoryViewer } from '../story';
import { StoryCaptureScreen } from '../story/capture';
import { ActivityScreen } from '../activity';
import { QuizResultScreen, QuizTakeScreen } from '../quiz';
import { MessagesScreen } from '../messages';
import { ThreadScreen } from '../messages/thread';
import { ContactCardScreen } from '../messages/contact-card';
import { FriendPodScreen } from '../pod';
import { CoopScreen } from '../coop';
import { CoopPortalScreen } from '../coop/portal';
import { PollsArchiveScreen } from '../polls';
import { NewsScreen } from './news';
import { ME } from '../../state/mock-data';

export type TabRoute =
TabKey |
'notifications' |
'event-detail' |
'event-host' |
'person' |
'discover-gate' |
'discover-detail' |
'story' |
'story-catchup' |
'story-comments' |
'capture' |
'activity' |
'quiz' |
'quiz-result' |
'home-quiz-taken' |
'profile' |
'profile-empty' |
'messages' |
'thread' |
'thread-blocked' |
'thread-grass' |
'contact-card' |
'pod' |
'pod-record' |
'coop' |
'coop-portal' |
'polls' |
'polls-empty' |
'profile-customize'
/* day-one states — every screen starts empty for everyone */ |
'home-empty' |
'events-empty' |
'discover-empty' |
'friends-empty' |
'notifications-empty' |
'messages-empty' |
'activity-empty' |
'pod-empty';

const PARENT: Record<string, TabKey> = {
  notifications: 'home',
  activity: 'home',
  quiz: 'home',
  'quiz-result': 'home',
  'home-quiz-taken': 'home',
  'event-detail': 'events',
  'event-host': 'events',
  person: 'friends',
  'discover-gate': 'discover',
  'discover-detail': 'discover',
  story: 'home',
  'story-catchup': 'home',
  'story-comments': 'home',
  capture: 'home',
  messages: 'home',
  thread: 'home',
  'thread-blocked': 'home',
  'thread-grass': 'home',
  'contact-card': 'home',
  pod: 'friends',
  'pod-record': 'friends',
  'home-empty': 'home',
  'events-empty': 'events',
  'discover-empty': 'discover',
  'friends-empty': 'friends',
  'notifications-empty': 'home',
  'messages-empty': 'home',
  'activity-empty': 'home',
  'pod-empty': 'friends',
  polls: 'home',
  'polls-empty': 'home'
};

/** Profile and co-op open from the header photo, not the pill. Hide the bar there. */
const HIDE_TABS = new Set<TabRoute>([
  'profile',
  'profile-empty',
  'profile-customize',
  'coop',
  'coop-portal'
]);

const FULL_SCREEN = [
'story',
'story-catchup',
'story-comments',
'capture',
'thread',
'thread-blocked',
'thread-grass'];


/** Your page look, saved once and honored wherever your profile renders. */
const STARTING_THEME: ProfileTheme = PROFILE_PRESETS.find((p) => p.id === 'scrapbook')!;

const STARTING_WIDGETS: CustomWidget[] = [
{
  id: 'cw1',
  afterCoreWidget: 'header',
  order: 0,
  type: 'quote',
  title: 'my mom, every time',
  body: '"Go outside, it is right there."',
  visibleToTier: 'friend'
},
{
  id: 'cw2',
  afterCoreWidget: 'hobbies',
  order: 0,
  type: 'photos',
  visibleToTier: 'friend'
}];


export function TabsLayout({ initialTab = 'home' }: {initialTab?: TabRoute;}) {
  const [route, setRoute] = React.useState<TabRoute>(initialTab);
  const [pageTheme, setPageTheme] = React.useState<ProfileTheme>(STARTING_THEME);
  const [pageWidgets, setPageWidgets] = React.useState<CustomWidget[]>(STARTING_WIDGETS);
  /** which friend profile is open (Coming up / roster both set this) */
  const [openPersonId, setOpenPersonId] = React.useState('maya');
  /** co-op membership decides where every co-op entry point lands */
  const [member, setMember] = React.useState(false);
  const openCoop = () => setRoute(member ? 'coop-portal' : 'coop');
  const openPerson = (id: string) => {
    setOpenPersonId(id);
    setRoute('person');
  };
  /** Home may pass person:devon so Coming up opens that friend, not a generic page */
  const handleOpenTab = (t: string) => {
    if (t.startsWith('person:')) {
      openPerson(t.slice('person:'.length));
      return;
    }
    if (t === 'coop') {
      openCoop();
      return;
    }
    setRoute(t as TabRoute);
  };
  const tab: TabKey = (PARENT[route] ?? route) as TabKey;
  const immersive = FULL_SCREEN.includes(route);
  const hideTabs = immersive || HIDE_TABS.has(route);

  return (
    <ProfileLinkProvider
      open={() => setRoute('profile')}
      profile={{ name: ME.name, emoji: ME.emoji, accent: ME.accent }}
    >
    <MessagesLinkProvider open={() => setRoute('messages')} unread>
    <div className="relative h-full w-full overflow-hidden bg-canvas">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
            key={route}
            variants={screenTransition}
            initial="hidden"
            animate="show"
            exit="exit"
            className="h-full">
            
          {route === 'home' &&
            <HomeScreen
              member={member}
              onOpenTab={handleOpenTab} />

            }
          {route === 'home-empty' &&
            <HomeScreen empty onOpenTab={handleOpenTab} />
            }
          {route === 'events' &&
            <EventsScreen
              onOpenEvent={() => setRoute('event-detail')}
              onOpenHost={() => setRoute('event-host')}
              onOpenThread={() => setRoute('thread-grass')} />

            }
          {route === 'events-empty' && <EventsScreen empty />}
          {route === 'discover' && <DiscoverScreen />}
          {route === 'discover-empty' && <DiscoverScreen empty />}
          {route === 'discover-gate' && <DiscoverScreen initialView="gate" />}
          {route === 'discover-detail' && <DiscoverScreen initialView="detail" />}
          {route === 'friends' &&
            <FriendsScreen
              onOpenPerson={openPerson}
              onOpenStory={() => setRoute('story')}
              onOpenPod={() => setRoute('pod')}
              onOpenPodRecord={() => setRoute('pod-record')} />

            }
          {route === 'friends-empty' &&
            <FriendsScreen empty onOpenPerson={openPerson} />
            }
          {route === 'news' && <NewsScreen />}
          {route === 'profile' &&
            <ProfileScreen
              customTheme={pageTheme}
              customWidgets={pageWidgets}
              member={member}
              onOpenCoop={openCoop}
              onCustomize={() => setRoute('profile-customize')}
              onOpenStory={() => setRoute('story')} />

            }
          {route === 'profile-empty' &&
            <ProfileScreen
              empty
              member={member}
              onOpenCoop={openCoop}
              onCustomize={() => setRoute('profile-customize')} />

            }
          {route === 'profile-customize' &&
            <CustomizeProfileScreen
              theme={pageTheme}
              widgets={pageWidgets}
              onBack={() => setRoute('profile')}
              onSave={(t, w) => {
                setPageTheme(t);
                setPageWidgets(w);
                setRoute('profile');
              }} />

            }
          {/* members land in the portal, everyone else on the benefits page */}
          {route === 'coop' &&
            <CoopScreen
              member={member}
              onBack={() => setRoute('profile')}
              onJoin={() => {
                setMember(true);
                setRoute('coop-portal');
              }}
              onOpenPortal={() => setRoute('coop-portal')} />

            }
          {route === 'polls' && <PollsArchiveScreen onBack={() => setRoute('home')} />}
          {route === 'polls-empty' &&
            <PollsArchiveScreen empty onBack={() => setRoute('home')} />
            }
          {route === 'coop-portal' &&
            <CoopPortalScreen
              onBack={() => setRoute('profile')}
              onBenefits={() => setRoute('coop')} />

            }
          {route === 'messages' &&
            <MessagesScreen
              onBack={() => setRoute('home')}
              onOpenThread={() => setRoute('thread')}
              onOpenContactCard={() => setRoute('contact-card')} />

            }
          {route === 'messages-empty' &&
            <MessagesScreen empty onBack={() => setRoute('home')} />
            }
          {route === 'thread' &&
            <ThreadScreen
              onBack={() => setRoute('messages')}
              onShareContact={() => setRoute('contact-card')} />

            }
          {/* arrived by saying "I'm in" — the yes is already sent */}
          {route === 'thread-grass' &&
            <ThreadScreen
              seedMessage="I'm in for touching grass. What's the plan?"
              onBack={() => setRoute('home')}
              onShareContact={() => setRoute('contact-card')} />

            }
          {route === 'thread-blocked' &&
            <ThreadScreen
              threadId="t3"
              blocked
              onBack={() => setRoute('messages')}
              onShareContact={() => setRoute('contact-card')} />

            }
          {route === 'contact-card' &&
            <ContactCardScreen onBack={() => setRoute('messages')} />
            }
          {route === 'pod' && <FriendPodScreen onBack={() => setRoute('friends')} />}
          {route === 'pod-empty' && <FriendPodScreen empty onBack={() => setRoute('friends')} />}
          {route === 'pod-record' &&
            <FriendPodScreen startRecording onBack={() => setRoute('friends')} />
            }
          {route === 'notifications' && <NotificationsScreen onBack={() => setRoute('home')} />}
          {route === 'notifications-empty' &&
            <NotificationsScreen empty onBack={() => setRoute('home')} />
            }
          {route === 'event-detail' &&
            <EventDetailScreen
              onBack={() => setRoute('events')}
              onOpenDiscover={() => setRoute('discover')} />

            }
          {route === 'event-host' && <EventHostScreen onBack={() => setRoute('events')} />}
          {route === 'person' && (
            <PersonScreen personId={openPersonId} onBack={() => setRoute('friends')} />
          )}
          {route === 'story' && <StoryViewer onClose={() => setRoute('home')} />}
          {route === 'story-catchup' &&
            <StoryViewer startCatchUpOpen onClose={() => setRoute('home')} />
            }
          {route === 'story-comments' &&
            <StoryViewer startCommentsOpen onClose={() => setRoute('home')} />
            }
          {route === 'capture' && <StoryCaptureScreen onClose={() => setRoute('home')} />}
          {route === 'activity' && <ActivityScreen onBack={() => setRoute('home')} />}
          {route === 'activity-empty' && <ActivityScreen empty onBack={() => setRoute('home')} />}
          {route === 'home-quiz-taken' &&
            <HomeScreen quizResultId="coastal" onOpenTab={handleOpenTab} />
            }
          {route === 'quiz' &&
            <QuizTakeScreen
              onBack={() => setRoute('home')}
              onDone={() => setRoute('quiz-result')} />

            }
          {route === 'quiz-result' &&
            <QuizResultScreen onBack={() => setRoute('home-quiz-taken')} />
            }
        </motion.div>
      </AnimatePresence>

      {!hideTabs &&
        <FloatingTabBar value={tab} onChange={(k) => setRoute(k)} badges={{ discover: true }} />
        }
    </div>
    </MessagesLinkProvider>
    </ProfileLinkProvider>);

}