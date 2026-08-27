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

export function useProfile() {
  const [header, setHeader] = useState<MyProfileHeader | null>(null);
  const [about, setAbout] = useState<AboutField[]>([]);
  const [hobbies, setHobbies] = useState<Interest[]>([]);
  const [favs, setFavs] = useState<FavGroup[]>([]);
  const [thisOrThat, setThisOrThat] = useState<ThisOrThatRow[]>([]);
  const [places, setPlaces] = useState<TravelPlace[]>([]);
  const [top5, setTop5] = useState<Top5Item[]>([]);
  const [obsession, setObsession] = useState<ObsessionSquare[]>([]);
  const [favorites, setFavorites] = useState<FavoriteModule[]>([]);
  const [greatestHits, setGreatestHits] = useState<PhotoBlock[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingEventRow[]>([]);
  const [hobbyFollowUps, setHobbyFollowUps] = useState<
    Record<string, { question: string; answer: string }>
  >({});
  const [blocked, setBlocked] = useState<Person[]>([]);
  const [introSeen, setIntroSeen] = useState(true);
  const [loading, setLoading] = useState(true);

  const me = getMe();

  const refresh = useCallback(async () => {
    setLoading(true);
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
      setHobbyFollowUps(getHobbyFollowUps());
      setBlocked(bl);
      setIntroSeen(intro);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onEditHeader = useCallback(async (patch: Partial<MyProfileHeader>) => {
    setHeader(await setMyProfileHeader(patch));
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
