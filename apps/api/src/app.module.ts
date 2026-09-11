// ============================================
// WHAT THIS FILE DOES (plain English):
// The "wiring diagram" for the backend. It lists every feature module the API
// is made of: health check, auth/Supabase, /me, admin console, and the
// public user modules (content, quiz, activity, co-op, delights).
// ============================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivityModule } from './activity/activity.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AssistantModule } from './assistant/assistant.module';
import { ConnectionsModule } from './connections/connections.module';
import { ContentModule } from './content/content.module';
import { CoopModule } from './coop/coop.module';
import { DelightModule } from './delight/delight.module';
import { EventsModule } from './events/events.module';
import { FeedModule } from './feed/feed.module';
import { HealthModule } from './health/health.module';
import { JnameModule } from './jname/jname.module';
import { MatchingModule } from './matching/matching.module';
import { MeModule } from './me/me.module';
import { MusicModule } from './music/music.module';
import { NotesModule } from './notes/notes.module';
import { PendingPeopleModule } from './pending-people/pending-people.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PhotoFiltersModule } from './photo-filters/photo-filters.module';
import { PollsModule } from './polls/polls.module';
import { ProfilesModule } from './profiles/profiles.module';
import { QuizModule } from './quiz/quiz.module';
import { QuotesModule } from './quotes/quotes.module';
import { RecapModule } from './recap/recap.module';
import { StoriesModule } from './stories/stories.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { TiersModule } from './tiers/tiers.module';
import { TouchGrassModule } from './touchgrass/touchgrass.module';
import { DemoWeekModule } from './demo-week/demo-week.module';

@Module({
  imports: [
    // Loads apps/api/.env and makes settings available everywhere (isGlobal).
    ConfigModule.forRoot({ isGlobal: true }),
    // The server's admin connection to Supabase (global).
    SupabaseModule,
    // Prefs-gated in-app notification writer (global).
    NotificationsModule,
    // AI gateway enqueue + worker helpers (keys stay server-side).
    AiModule,
    // Opt-in relationship Assistant (personal_agent lane).
    AssistantModule,
    HealthModule,
    DemoWeekModule,
    MeModule,
    NotesModule,
    PendingPeopleModule,
    MusicModule,
    MatchingModule,
    ProfilesModule,
    PhotoFiltersModule,
    TiersModule,
    ConnectionsModule,
    StoriesModule,
    EventsModule,
    FeedModule,
    AdminAuthModule,
    AdminModule,
    ContentModule,
    QuizModule,
    QuotesModule,
    JnameModule,
    ActivityModule,
    CoopModule,
    DelightModule,
    TouchGrassModule,
    PollsModule,
    RecapModule,
    TelemetryModule
  ]
})
export class AppModule {}
