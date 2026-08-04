// ============================================
// WHAT THIS FILE DOES (plain English):
// React hook for your own Profile card. Loads the header, Currently, and all
// card sections in one go, and exposes the small mutations (check in, edit
// city/bio). Screens never import fixtures directly.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { Person } from '@bridger/shared';
import { getMe } from '../data/people';
import {
  getCurrently,
  getMyProfileHeader,
  listAboutFields,
  listBlocked,
  listFavs,
  listHobbies,
  listThisOrThat,
  listTravelPlaces,
  setCheckedIn,
  setMyProfileHeader,
  unblock,
  type AboutField,
  type Currently,
  type FavGroup,
  type Interest,
  type MyProfileHeader,
  type ThisOrThatRow,
  type TravelPlace
} from '../data/profile';

export function useProfile() {
  const [header, setHeader] = useState<MyProfileHeader | null>(null);
  const [currently, setCurrently] = useState<Currently | null>(null);
  const [about, setAbout] = useState<AboutField[]>([]);
  const [hobbies, setHobbies] = useState<Interest[]>([]);
  const [favs, setFavs] = useState<FavGroup[]>([]);
  const [thisOrThat, setThisOrThat] = useState<ThisOrThatRow[]>([]);
  const [places, setPlaces] = useState<TravelPlace[]>([]);
  const [blocked, setBlocked] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const me = getMe();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [h, cur, ab, hob, fv, tot, pl, bl] = await Promise.all([
        getMyProfileHeader(),
        getCurrently(),
        listAboutFields(),
        listHobbies(),
        listFavs(),
        listThisOrThat(),
        listTravelPlaces(),
        listBlocked()
      ]);
      setHeader(h);
      setCurrently(cur);
      setAbout(ab);
      setHobbies(hob);
      setFavs(fv);
      setThisOrThat(tot);
      setPlaces(pl);
      setBlocked(bl);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCheckIn = useCallback(async (on: boolean) => {
    setCurrently(await setCheckedIn(on));
  }, []);

  const onEditHeader = useCallback(async (patch: Partial<MyProfileHeader>) => {
    setHeader(await setMyProfileHeader(patch));
  }, []);

  const onUnblock = useCallback(async (personId: string) => {
    await unblock(personId);
    setBlocked(await listBlocked());
  }, []);

  return {
    me,
    header,
    currently,
    about,
    hobbies,
    favs,
    thisOrThat,
    places,
    blocked,
    loading,
    refresh,
    onCheckIn,
    onEditHeader,
    onUnblock
  };
}
