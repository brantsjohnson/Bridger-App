// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for your own Profile card. Loads the header and all Spotify
// layout sections in one go, and exposes small mutations (edit city/bio).
// Screens never import fixtures directly.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type {
  FavoriteModule,
  ObsessionSquare,
  Person,
  PhotoBlock,
  Top5Item
} from '@bridger/shared';
import { listUpcomingForProfile } from '../data/events';
import { getMe } from '../data/people';
import {
  getHobbyFollowUps,
  getMyProfileHeader,
  getProfileIntroSeen,
  listAboutFields,
  listBlocked,
  listFavoriteModules,
  listFavs,
  listGreatestHits,
  listHobbies,
  listObsession,
  listThisOrThat,
  listTop5,
  listTravelPlaces,
  setMyProfileHeader,
  setProfileIntroSeen,
  unblock,
  type AboutField,
  type FavGroup,
  type Interest,
  type MyProfileHeader,
  type ThisOrThatRow,
  type TravelPlace
} from '../data/profile';
import type { UpcomingEventRow } from '../components/profile/UpcomingEventsSection';
import { getTabSnapshot, setTabSnapshot } from '../lib/tab-snapshots';

type ProfileSnap = {
  header: MyProfileHeader | null;
  about: AboutField[];
  hobbies: Interest[];
  favs: FavGroup[];
  thisOrThat: ThisOrThatRow[];
  places: TravelPlace[];
  top5: Top5Item[];
  obsession: ObsessionSquare[];
  favorites: FavoriteModule[];
  greatestHits: PhotoBlock[];
  upcoming: UpcomingEventRow[];
  hobbyFollowUps: Record<string, { question: string; answer: string }>;
  blocked: Person[];
  introSeen: boolean;
};

const SNAP_KEY = 'profile';

export function useProfile() {
  const cached = getTabSnapshot<ProfileSnap>(SNAP_KEY);
  const [header, setHeader] = useState<MyProfileHeader | null>(cached?.header ?? null);
  const [about, setAbout] = useState<AboutField[]>(cached?.about ?? []);
  const [hobbies, setHobbies] = useState<Interest[]>(cached?.hobbies ?? []);
  const [favs, setFavs] = useState<FavGroup[]>(cached?.favs ?? []);
  const [thisOrThat, setThisOrThat] = useState<ThisOrThatRow[]>(
    cached?.thisOrThat ?? []
  );
  const [places, setPlaces] = useState<TravelPlace[]>(cached?.places ?? []);
  const [top5, setTop5] = useState<Top5Item[]>(cached?.top5 ?? []);
  const [obsession, setObsession] = useState<ObsessionSquare[]>(
    cached?.obsession ?? []
  );
  const [favorites, setFavorites] = useState<FavoriteModule[]>(
    cached?.favorites ?? []
  );
  const [greatestHits, setGreatestHits] = useState<PhotoBlock[]>(
    cached?.greatestHits ?? []
  );
  const [upcoming, setUpcoming] = useState<UpcomingEventRow[]>(
    cached?.upcoming ?? []
  );
  const [hobbyFollowUps, setHobbyFollowUps] = useState<
    Record<string, { question: string; answer: string }>
  >(cached?.hobbyFollowUps ?? {});
  const [blocked, setBlocked] = useState<Person[]>(cached?.blocked ?? []);
  const [introSeen, setIntroSeen] = useState(cached?.introSeen ?? true);
  const [loading, setLoading] = useState(!cached);

  const me = getMe();

  const refresh = useCallback(async () => {
    const hadCache = Boolean(getTabSnapshot<ProfileSnap>(SNAP_KEY));
    if (!hadCache) setLoading(true);
    try {
      const [h, ab, hob, fv, tot, pl, t5, ob, favMods, gh, up, bl, intro] =
        await Promise.all([
          getMyProfileHeader(),
          listAboutFields(),
          listHobbies(),
          listFavs(),
          listThisOrThat(),
          listTravelPlaces(),
          listTop5(),
          listObsession(),
          listFavoriteModules(true),
          listGreatestHits(),
          listUpcomingForProfile('me'),
          listBlocked(),
          getProfileIntroSeen()
        ]);
      const followUps = getHobbyFollowUps();
      setHeader(h);
      setAbout(ab);
      setHobbies(hob);
      setFavs(fv);
      setThisOrThat(tot);
      setPlaces(pl);
      setTop5(t5);
      setObsession(ob);
      setFavorites(favMods);
      setGreatestHits(gh);
      setUpcoming(up);
      setHobbyFollowUps(followUps);
      setBlocked(bl);
      setIntroSeen(intro);
      setTabSnapshot<ProfileSnap>(SNAP_KEY, {
        header: h,
        about: ab,
        hobbies: hob,
        favs: fv,
        thisOrThat: tot,
        places: pl,
        top5: t5,
        obsession: ob,
        favorites: favMods,
        greatestHits: gh,
        upcoming: up,
        hobbyFollowUps: followUps,
        blocked: bl,
        introSeen: intro
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onEditHeader = useCallback(async (patch: Partial<MyProfileHeader>) => {
    const next = await setMyProfileHeader(patch);
    setHeader(next);
    const prev = getTabSnapshot<ProfileSnap>(SNAP_KEY);
    if (prev) setTabSnapshot(SNAP_KEY, { ...prev, header: next });
  }, []);

  const onUnblock = useCallback(async (personId: string) => {
    await unblock(personId);
    setBlocked(await listBlocked());
  }, []);

  const onIntroContinue = useCallback(async () => {
    await setProfileIntroSeen();
    setIntroSeen(true);
  }, []);

  return {
    me,
    header,
    about,
    hobbies,
    favs,
    thisOrThat,
    places,
    top5,
    obsession,
    favorites,
    greatestHits,
    upcoming,
    hobbyFollowUps,
    blocked,
    introSeen,
    loading,
    refresh,
    onEditHeader,
    onUnblock,
    onIntroContinue
  };
}
