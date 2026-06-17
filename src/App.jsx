import { useEffect, useRef, useState } from 'react';
import './App.css';
import { sampleProfiles } from './data/sampleProfiles';
import BottomNav from './components/BottomNav';
import ProfileCard from './components/ProfileCard';
import ProfileForm from './components/ProfileForm';
import { supabase } from './lib/supabaseClient';



function App() {
  const savedData = JSON.parse(localStorage.getItem('festivalDatingData')) || {};
  
  const [isEntered, setIsEntered] = useState(savedData.isEntered || false);
  



  const [profile, setProfile] = useState(
    savedData.profile || {
      nickname: '',
      gender: '',
      targetGender: '',
      grade: '',
      age: '',
      department: '',
      mbti: '',
      faceType: '',
      interests: '',
      introduction: '',
      idealType: '',
      egenTetoScore: '',
      contactType: 'instagram',
      contactValue: '',
    }
  );

  const [isProfileSaved, setIsProfileSaved] = useState(savedData.isProfileSaved || false);
  const [currentPage, setCurrentPage] = useState(savedData.currentPage || 'profileComplete');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [likedProfileIds, setLikedProfileIds] = useState(savedData.likedProfileIds || []);
  const [rejectedProfileIds, setRejectedProfileIds] = useState([]);
  const [profileFormMode, setProfileFormMode] = useState('create');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const hasInitializedVisibleProfileIdsRef = useRef(false);
  const skipNextNewProfileNoticeRef = useRef(false);
  
  
  const profileOrderRef = useRef([]);

  const maxLikes = 3;
  const likeRecoveryHours = 2;
  const likeRecoveryMs = likeRecoveryHours * 60 * 60 * 1000;
  

  const [likeCredits, setLikeCredits] = useState(
    savedData.likeCredits ?? maxLikes
  );

  const [lastLikeRecoveredAt, setLastLikeRecoveredAt] = useState(
    savedData.lastLikeRecoveredAt || new Date().toISOString()
  );


  const [nowTime, setNowTime] = useState(Date.now());
  const remainingLikes = likeCredits;
  
  
  const recoverLikeCredits = () => {
    const lastRecoveredTime = new Date(lastLikeRecoveredAt).getTime();
    const now = Date.now();
  
    if (!lastRecoveredTime || likeCredits >= maxLikes) {
      return;
    }
  
    const elapsedMs = now - lastRecoveredTime;
    const recoveredCount = Math.floor(elapsedMs / likeRecoveryMs);
  
    if (recoveredCount <= 0) {
      return;
    }
  
    const nextLikeCredits = Math.min(maxLikes, likeCredits + recoveredCount);
    const nextRecoveredAt = new Date(
      lastRecoveredTime + recoveredCount * likeRecoveryMs
    ).toISOString();
  
    setLikeCredits(nextLikeCredits);
    setLastLikeRecoveredAt(nextRecoveredAt);
  };
  
  const getLikeRecoveryText = () => {
    if (likeCredits >= maxLikes) {
      return '';
    }
  
    const lastRecoveredTime = new Date(lastLikeRecoveredAt).getTime();
  
    if (!lastRecoveredTime) {
      return '';
    }
  
    const elapsedMs = nowTime - lastRecoveredTime;
    const remainingMs = Math.max(
      0,
      likeRecoveryMs - (elapsedMs % likeRecoveryMs)
    );
  
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')} 후 +1`;
    }
  
    if (minutes > 0) {
      return `${minutes}분 후 +1`;
    }
  
    return `${seconds}초 후 +1`;
  };
  
  
  const [receivedLikeIds, setReceivedLikeIds] = useState([]);
  const [matchedProfileIds, setMatchedProfileIds] = useState(savedData.matchedProfileIds || []);
  



  const [isProfileVisible, setIsProfileVisible] = useState(savedData.isProfileVisible ?? true);
  const [supabaseProfileId, setSupabaseProfileId] = useState(savedData.supabaseProfileId || null);
  const [participantCode, setParticipantCode] = useState(savedData.participantCode || '');
  
  
  
  const [currentUserId, setCurrentUserId] = useState(null);
  const [startMode, setStartMode] = useState('home');
  const [lookupCode, setLookupCode] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [processingProfileId, setProcessingProfileId] = useState(null);
  const [processingReceivedProfileId, setProcessingReceivedProfileId] = useState(null);
  const [processingReceivedAction, setProcessingReceivedAction] = useState('');
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [toastQueue, setToastQueue] = useState([]);
  const isCheckingNotificationsRef = useRef(false);
  const recentToastKeysRef = useRef(new Set());
  const [supabaseProfiles, setSupabaseProfiles] = useState([]);
  const [contactMap, setContactMap] = useState({});
  const [selectedMbtiFilters, setSelectedMbtiFilters] = useState([]);
  const [selectedInterestFilters, setSelectedInterestFilters] = useState([]);
  const [egenTetoFilter, setEgenTetoFilter] = useState('');
  const mbtiTypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP',
  ];
  
  
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [browseProfileIndex, setBrowseProfileIndex] = useState(0);
  const profileTouchStartRef = useRef({ x: 0, y: 0 });
  const profileTouchEndRef = useRef({ x: 0, y: 0 });
  const profileSwipeModeRef = useRef(null);

  
  const previousVisibleProfileIdsRef = useRef([]);
  const [newProfileNoticeCount, setNewProfileNoticeCount] = useState(0);


  const maxMatches = 3;
  const isMatchFull = matchedProfileIds.length >= maxMatches;
  const profileStatus = isProfileVisible ? '공개 중' : '숨김 중';

  useEffect(() => {
    const dataToSave = {
      isEntered,
      isProfileSaved,
      currentPage,
      profile,
      likedProfileIds,
      receivedLikeIds,
      matchedProfileIds,
      likeCredits,
      lastLikeRecoveredAt,
      
      isProfileVisible,
      supabaseProfileId,
      participantCode,
    
    
    };
  
    localStorage.setItem('festivalDatingData', JSON.stringify(dataToSave));
  }, [
    isEntered,
    isProfileSaved,
    currentPage,
    profile,
    likedProfileIds,
    receivedLikeIds,
    matchedProfileIds,
    isProfileVisible,
    supabaseProfileId,
    participantCode,

  ]);


  useEffect(() => {
    loadSupabaseProfiles();
  }, []);


  useEffect(() => {
    ensureAnonymousUser();
  }, []);
  
  


  useEffect(() => {
    setBrowseProfileIndex(0);
  }, [
    searchKeyword,
    selectedMbtiFilters,
    selectedInterestFilters,
    egenTetoFilter,
  ]);


  useEffect(() => {
    if (supabaseProfileId) {
      loadMySentLikes(supabaseProfileId);
      loadMyReceivedLikes(supabaseProfileId);
      loadMyMatches(supabaseProfileId);
      checkUnseenNotifications(supabaseProfileId);
    }
  }, [supabaseProfileId]);



  useEffect(() => {
    recoverLikeCredits();
  
    const timer = setInterval(() => {
      recoverLikeCredits();
    }, 60 * 1000);
  
    return () => clearInterval(timer);
  }, [likeCredits, lastLikeRecoveredAt]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
  
    return () => clearInterval(timer);
  }, []);



  useEffect(() => {
  if (!supabaseProfileId || !isProfileSaved) {
    return;
  }

  const refreshMyActivity = async () => {
    
    await loadMyReceivedLikes(supabaseProfileId);
    await loadMySentLikes(supabaseProfileId);
    await loadMyMatches(supabaseProfileId);
  };

  refreshMyActivity();

  const timer = setInterval(() => {
    refreshMyActivity();
  }, 8000);

  return () => clearInterval(timer);
}, [supabaseProfileId, isProfileSaved]);

useEffect(() => {
  if (!isProfileSaved) {
    return;
  }

  loadSupabaseProfiles();

  const timer = setInterval(() => {
    loadSupabaseProfiles();
  }, 8000);

  return () => clearInterval(timer);
}, [isProfileSaved]);



  useEffect(() => {
    if (toastMessage || toastQueue.length === 0) {
      return;
    }
  
    const nextToast = toastQueue[0];
  
    setToastMessage(nextToast.message);
    setToastType(nextToast.type);
    setToastQueue((prevQueue) => prevQueue.slice(1));
  }, [toastMessage, toastQueue]);


  useEffect(() => {
    if (!toastMessage) {
      return;
    }
  
    const timer = setTimeout(() => {
      setToastMessage('');
    }, 3000);
  
    return () => clearTimeout(timer);
  }, [toastMessage]);



  useEffect(() => {
    loadContactsForMatches(matchedProfileIds);
  }, [matchedProfileIds]);

  useEffect(() => {
    if (!supabaseProfileId) {
      return;
    }
  
    const channel = supabase
      .channel('likes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
        },
        async (payload) => {
          
          
          
          
          if (
            payload.eventType === 'UPDATE' &&
            String(payload.new?.sender_profile_id) === String(supabaseProfileId) &&
            payload.new?.status === 'rejected' &&
            payload.new?.sender_seen_result === false
          ) {
            if (document.visibilityState === 'visible' && document.hasFocus()) {
              showToast('상대가 관심을 거절했어요.', 'warning');
          
              await supabase
                .from('likes')
                .update({
                  sender_seen_result: true,
                })
                .eq('id', payload.new.id);
            }
          }
  
          

          





          


          







          await loadMySentLikes(supabaseProfileId);
          await loadMyReceivedLikes(supabaseProfileId);
          await loadMyMatches(supabaseProfileId);
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseProfileId]);

  
  
  useEffect(() => {
    const channel = supabase
      .channel('profiles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        async () => {
          
          
          
          
          
          await loadSupabaseProfiles();
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);



  useEffect(() => {
    if (!supabaseProfileId) {
      return;
    }
  
    const refreshUserState = async () => {
      await checkUnseenNotifications(supabaseProfileId);
      await loadMySentLikes(supabaseProfileId);
      await loadMyReceivedLikes(supabaseProfileId);
      await loadMyMatches(supabaseProfileId);
      await loadSupabaseProfiles();
    };
    

    const refreshOnReturn = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
  
      refreshUserState();
  
      setTimeout(() => {
        refreshUserState();
      }, 800);
  
      setTimeout(() => {
        refreshUserState();
      }, 2500);
    };
  
    document.addEventListener('visibilitychange', refreshOnReturn);
    window.addEventListener('focus', refreshOnReturn);
    window.addEventListener('pageshow', refreshOnReturn);
  
    return () => {
      document.removeEventListener('visibilitychange', refreshOnReturn);
      window.removeEventListener('focus', refreshOnReturn);
      window.removeEventListener('pageshow', refreshOnReturn);
    };
  }, [supabaseProfileId]);


  

  
  const handleStartNewProfile = () => {
    setIsEntered(true);
    setIsProfileSaved(false);
    setProfileFormMode('create');
    setCurrentPage('profileComplete');
    setLikedProfileIds([]);
    setRejectedProfileIds([]);
    setMatchedProfileIds([]);
    setLikeCredits(maxLikes);
    setLastLikeRecoveredAt(new Date().toISOString());
  
  
  
  };


  const handleCancelProfileForm = () => {
    if (profileFormMode === 'edit') {
      setIsProfileSaved(true);
      setCurrentPage('profileComplete');
      setProfileFormMode('create');
      return;
    }
  
    setIsEntered(false);
    setStartMode('home');
  };
  

  const showToast = (message, type = 'info', key = '') => {
    const toastKey = key || `${type}:${message}`;
  
    if (recentToastKeysRef.current.has(toastKey)) {
      return;
    }
  
    recentToastKeysRef.current.add(toastKey);
  
    setToastQueue((prevQueue) => {
      const alreadyQueued = prevQueue.some(
        (toast) => toast.key === toastKey
      );
  
      if (alreadyQueued) {
        return prevQueue;
      }
  
      return [
        ...prevQueue,
        {
          id: Date.now() + Math.random(),
          key: toastKey,
          message,
          type,
        },
      ];
    });
  
    setTimeout(() => {
      recentToastKeysRef.current.delete(toastKey);
    }, 8000);
  };

  





  const ensureAnonymousUser = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
    if (sessionError) {
      console.error('세션 확인 오류:', sessionError);
      return null;
    }
  
    if (sessionData.session?.user) {
      console.log('기존 사용자 ID:', sessionData.session.user.id);
      setCurrentUserId(sessionData.session.user.id);
      return sessionData.session.user;
    }
  
    const { data, error } = await supabase.auth.signInAnonymously();
  
    if (error) {
      console.error('익명 로그인 오류:', error);
      alert(`익명 로그인 오류: ${error.message}`);
      return null;
    }
  
    console.log('익명 사용자 ID:', data.user.id);
    setCurrentUserId(data.user.id);
    return data.user;
  };




  const handleCopyParticipantCode = async () => {
    if (!participantCode) {
      alert('복사할 참여 코드가 없어요.');
      return;
    }
  
    try {
      await navigator.clipboard.writeText(participantCode);
      alert('참여 코드가 복사됐어요.');
    } catch (error) {
      console.error('참여 코드 복사 오류:', error);
      alert('복사에 실패했어요. 참여 코드를 직접 캡처하거나 메모해주세요.');
    }
  };


  const handleCopyContactValue = async (contactValue) => {
    if (!contactValue) {
      return;
    }
  
    try {
      await navigator.clipboard.writeText(contactValue);
      showToast('연락수단이 복사됐어요.');
    } catch (error) {
      console.error('연락수단 복사 오류:', error);
      alert('복사에 실패했어요. 직접 선택해서 복사해주세요.');
    }
  };

  const handleLoadProfileByCode = async () => {
    if (isLoadingProfile) {
      return;
    }
  
    const code = lookupCode.trim().toUpperCase();
  
    if (!code) {
      alert('참여 코드를 입력해주세요.');
      return;
    }
  
    setIsLoadingProfile(true);
  
    setIsLoadingProfile(true);

      const { data, error: profileError } = await supabase
        .rpc('load_profile_by_participant_code', {
          input_code: code,
        });

      if (profileError) {
        console.error('프로필 불러오기 오류:', profileError);
        alert(`프로필 불러오기 오류: ${profileError.message}`);
        setIsLoadingProfile(false);
        return;
      }

      const foundProfile = Array.isArray(data) ? data[0] : data;
        
          if (!foundProfile) {
            alert('해당 참여 코드로 등록된 프로필을 찾을 수 없어요.');
            setIsLoadingProfile(false);
            return;
          }
  
    const user = await ensureAnonymousUser();

    if (!user) {
      setIsLoadingProfile(false);
      return;
    }

    const { error: ownerUpdateError } = await supabase
      .from('profiles')
      .update({
        owner_id: user.id,
      })
      .eq('id', foundProfile.id);

    if (ownerUpdateError) {
      console.error('프로필 소유자 연결 오류:', ownerUpdateError);
      alert(`프로필 소유자 연결 오류: ${ownerUpdateError.message}`);
      setIsLoadingProfile(false);
      return;
    }







    const { data: foundContact, error: contactError } = await supabase
      .from('contacts')
      .select('contact_type, contact_value')
      .eq('profile_id', foundProfile.id)
      .maybeSingle();
  
    
      if (contactError) {
      console.error('연락수단 불러오기 오류:', contactError);
      alert(`연락수단 불러오기 오류: ${contactError.message}`);
      setIsLoadingProfile(false);
      return;
    }
    
  
    setProfile({
      nickname: foundProfile.nickname,
      gender: foundProfile.gender,
      targetGender: foundProfile.target_gender,
      grade: foundProfile.grade || '',
      age: foundProfile.age ? String(foundProfile.age) : '',
      department: foundProfile.department || '',
      mbti: foundProfile.mbti || '',
      faceType: foundProfile.face_type || '',
      interests: foundProfile.interests,
      introduction: foundProfile.introduction,
      idealType: foundProfile.ideal_type || '',
      egenTetoScore:
        foundProfile.egen_teto_score !== null && foundProfile.egen_teto_score !== undefined
          ? String(foundProfile.egen_teto_score)
          : '',
      
      
      contactType: foundContact?.contact_type || 'instagram',
      contactValue: foundContact?.contact_value || '',
    });
  
    setSupabaseProfileId(foundProfile.id);
    setParticipantCode(foundProfile.participant_code || code);
    setIsProfileVisible(foundProfile.is_visible);
    setIsEntered(true);
    setIsProfileSaved(true);
    setCurrentPage('profileComplete');
    setProfileFormMode('create');
    setStartMode('home');
    setLookupCode('');
  
    setNewProfileNoticeCount(0);
    previousVisibleProfileIdsRef.current = [];
    hasInitializedVisibleProfileIdsRef.current = false;

    await loadSupabaseProfiles();
    await loadMySentLikes(foundProfile.id);
    await loadMyReceivedLikes(foundProfile.id);
    await loadMyMatches(foundProfile.id);
    await checkUnseenNotifications(foundProfile.id);

    setIsLoadingProfile(false);
  };





  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile({
      ...profile,
      [name]: value,
    });
  };



  const shuffleProfiles = (profiles) => {
    const shuffledProfiles = [...profiles];
  
    for (let i = shuffledProfiles.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
  
      [shuffledProfiles[i], shuffledProfiles[randomIndex]] = [
        shuffledProfiles[randomIndex],
        shuffledProfiles[i],
      ];
    }
  
    return shuffledProfiles;
  };
  

  const orderProfilesForBrowse = (profiles) => {
    const profileMap = new Map(
      profiles.map((profileItem) => [profileItem.id, profileItem])
    );
  
    if (profileOrderRef.current.length === 0) {
      const shuffledProfiles = shuffleProfiles(profiles);
      profileOrderRef.current = shuffledProfiles.map(
        (profileItem) => profileItem.id
      );
  
      return shuffledProfiles;
    }
  
    const existingOrderedIds = profileOrderRef.current.filter((profileId) =>
      profileMap.has(profileId)
    );
  
    const existingIdSet = new Set(existingOrderedIds);
  
    const newProfiles = profiles.filter(
      (profileItem) => !existingIdSet.has(profileItem.id)
    );
  
    const shuffledNewProfiles = shuffleProfiles(newProfiles);
  
    profileOrderRef.current = [
      ...shuffledNewProfiles.map((profileItem) => profileItem.id),
      ...existingOrderedIds,
    ];
    return profileOrderRef.current
      .map((profileId) => profileMap.get(profileId))
      .filter(Boolean);
  };





  const loadSupabaseProfiles = async () => {
    console.log('프로필 목록 새로고침 실행');
    const { data, error } = await supabase
      .from('public_profiles')
      .select('*')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('프로필 불러오기 오류:', error);
      alert(`프로필을 불러오는 중 오류가 발생했어요: ${error.message}`);
      return;
    }
  
    const loadedProfiles = data || [];
    console.log('불러온 프로필 수:', loadedProfiles.length);
    const formattedProfiles = loadedProfiles.map((item) => ({
      id: item.id,
      nickname: item.nickname,
      gender: item.gender,
      targetGender: item.target_gender,
      grade: item.grade || '',
      age: item.age ? String(item.age) : '',
      department: item.department || '',
      mbti: item.mbti || '',
      faceType: item.face_type || '',
      interests: item.interests || '',
      introduction: item.introduction || '',
      idealType: item.ideal_type || '',
      egenTetoScore:
        item.egen_teto_score !== null && item.egen_teto_score !== undefined
          ? String(item.egen_teto_score)
          : '',
      isVisible: item.is_visible,
    }));
  
    const currentProfileIds = formattedProfiles
      .map((profileItem) => String(profileItem.id))
      .filter((profileId) => profileId !== String(supabaseProfileId));
  
      if (isProfileSaved && supabaseProfileId) {
        if (skipNextNewProfileNoticeRef.current) {
          previousVisibleProfileIdsRef.current = currentProfileIds;
          hasInitializedVisibleProfileIdsRef.current = true;
          skipNextNewProfileNoticeRef.current = false;
          setNewProfileNoticeCount(0);
        } else if (!hasInitializedVisibleProfileIdsRef.current) {
          previousVisibleProfileIdsRef.current = currentProfileIds;
          hasInitializedVisibleProfileIdsRef.current = true;
          setNewProfileNoticeCount(0);
        } else {
          const newProfileIds = currentProfileIds.filter(
            (profileId) =>
              profileId !== String(supabaseProfileId) &&
              !previousVisibleProfileIdsRef.current.includes(profileId)
          );
      
          if (newProfileIds.length > 0) {
            setNewProfileNoticeCount((prevCount) => prevCount + newProfileIds.length);
          }
      
          previousVisibleProfileIdsRef.current = currentProfileIds;
        }
      }
  
    const orderedProfiles = orderProfilesForBrowse(formattedProfiles);
    console.log('formattedProfiles 수:', formattedProfiles.length);
    setSupabaseProfiles(orderedProfiles);
  };

  const loadMySentLikes = async (profileId) => {
    if (!profileId) {
      setLikedProfileIds([]);
      setRejectedProfileIds([]);
      return;
    }
  



    const { data, error } = await supabase
      .from('likes')
      .select('receiver_profile_id, status')
      .eq('sender_profile_id', profileId);
  
    if (error) {
      console.error('보낸 관심 불러오기 오류:', error);
      alert(`보낸 관심 불러오기 오류: ${error.message}`);
      return;
    }
  
    const pendingIds = data
      .filter((item) => item.status === 'pending')
      .map((item) => item.receiver_profile_id);
  
    const rejectedIds = data
      .filter((item) => item.status === 'rejected')
      .map((item) => item.receiver_profile_id);
  
    setLikedProfileIds(pendingIds);
    setRejectedProfileIds(rejectedIds);
  };


  const checkUnseenRejectedLikes = async (profileId) => {
    if (!profileId) {
      return;
    }
  
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('sender_profile_id', profileId)
      .eq('status', 'rejected')
      .eq('sender_seen_result', false);
  
    if (error) {
      console.error('미확인 거절 알림 확인 오류:', error);
      return;
    }
  
    if (!data || data.length === 0) {
      return;
    }
  
    showToast('보낸 관심 중 거절된 관심이 있어요.', 'warning');
  
    const rejectedLikeIds = data.map((item) => item.id);
  
    const { error: updateError } = await supabase
      .from('likes')
      .update({
        sender_seen_result: true,
      })
      .in('id', rejectedLikeIds);
  
    if (updateError) {
      console.error('거절 알림 확인 처리 오류:', updateError);
    }
  };


  const checkUnseenReceivedLikes = async (profileId) => {
    if (!profileId) {
      return;
    }
  
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('receiver_profile_id', profileId)
      .eq('status', 'pending')
      .eq('receiver_seen_like', false);
  
    if (error) {
      console.error('미확인 받은 관심 알림 확인 오류:', error);
      return;
    }
  
    if (!data || data.length === 0) {
      return;
    }
  
    
  
    if (updateError) {
      console.error('받은 관심 알림 확인 처리 오류:', updateError);
    }
  };











  const checkUnseenMatches = async (profileId) => {
    if (!profileId) {
      return;
    }
  
    const { data, error } = await supabase
      .from('likes')
      .select('id, sender_profile_id, receiver_profile_id, sender_seen_match, receiver_seen_match')
      .eq('status', 'accepted')
      .or(
        `and(sender_profile_id.eq.${profileId},sender_seen_match.eq.false),and(receiver_profile_id.eq.${profileId},receiver_seen_match.eq.false)`
      );
  
    if (error) {
      console.error('미확인 매칭 알림 확인 오류:', error);
      return;
    }
  
    if (!data || data.length === 0) {
      return;
    }
  
    const message =
      data.length === 1
        ? '새 매칭이 있어요!'
        : `새 매칭이 ${data.length}개 있어요!`;
  
    showToast(message, 'success');
  
    const senderMatchIds = data
      .filter((item) => String(item.sender_profile_id) === String(profileId))
      .map((item) => item.id);
  
    const receiverMatchIds = data
      .filter((item) => String(item.receiver_profile_id) === String(profileId))
      .map((item) => item.id);
  
    if (senderMatchIds.length > 0) {
      const { error: senderUpdateError } = await supabase
        .from('likes')
        .update({
          sender_seen_match: true,
        })
        .in('id', senderMatchIds);
  
      if (senderUpdateError) {
        console.error('보낸 관심 매칭 알림 확인 처리 오류:', senderUpdateError);
      }
    }
  
    if (receiverMatchIds.length > 0) {
      const { error: receiverUpdateError } = await supabase
        .from('likes')
        .update({
          receiver_seen_match: true,
        })
        .in('id', receiverMatchIds);
  
      if (receiverUpdateError) {
        console.error('받은 관심 매칭 알림 확인 처리 오류:', receiverUpdateError);
      }
    }
  };


  const checkUnseenNotifications = async (profileId) => {
    if (!profileId || isCheckingNotificationsRef.current) {
      return;
    }
  
    isCheckingNotificationsRef.current = true;
  
    try {
      const queuedToasts = [];
  
    const { data: rejectedLikes, error: rejectedError } = await supabase
      .from('likes')
      .select('id')
      .eq('sender_profile_id', profileId)
      .eq('status', 'rejected')
      .eq('sender_seen_result', false);
  
    if (rejectedError) {
      console.error('미확인 거절 알림 확인 오류:', rejectedError);
    }
  
    if (rejectedLikes && rejectedLikes.length > 0) {
      queuedToasts.push({
        message:
          rejectedLikes.length === 1
            ? '보낸 관심 중 거절된 관심이 있어요.'
            : `보낸 관심 중 거절된 관심이 ${rejectedLikes.length}개 있어요.`,
        type: 'warning',
      });
    }
  
    const { data: receivedLikes, error: receivedError } = await supabase
      .from('likes')
      .select('id')
      .eq('receiver_profile_id', profileId)
      .eq('status', 'pending')
      .eq('receiver_seen_like', false);
  
    if (receivedError) {
      console.error('미확인 받은 관심 알림 확인 오류:', receivedError);
    }
  
    if (receivedLikes && receivedLikes.length > 0) {
      queuedToasts.push({
        message:
          receivedLikes.length === 1
            ? '새 관심이 도착했어요.'
            : `새 관심이 ${receivedLikes.length}개 도착했어요.`,
        type: 'info',
      });
    }
  
    const { data: unseenMatches, error: matchError } = await supabase
      .from('likes')
      .select('id, sender_profile_id, receiver_profile_id, sender_seen_match, receiver_seen_match')
      .eq('status', 'accepted')
      .or(
        `and(sender_profile_id.eq.${profileId},sender_seen_match.eq.false),and(receiver_profile_id.eq.${profileId},receiver_seen_match.eq.false)`
      );
  
    if (matchError) {
      console.error('미확인 매칭 알림 확인 오류:', matchError);
    }
  
    if (unseenMatches && unseenMatches.length > 0) {
      queuedToasts.push({
        message:
          unseenMatches.length === 1
            ? '새 매칭이 있어요!'
            : `새 매칭이 ${unseenMatches.length}개 있어요!`,
        type: 'success',
      });
    }
  
    queuedToasts.forEach((toast) => {
      showToast(toast.message, toast.type);
    });
  
    if (rejectedLikes && rejectedLikes.length > 0) {
      const rejectedIds = rejectedLikes.map((item) => item.id);
  
      await supabase
        .from('likes')
        .update({
          sender_seen_result: true,
        })
        .in('id', rejectedIds);
    }
  
    if (receivedLikes && receivedLikes.length > 0) {
      const receivedIds = receivedLikes.map((item) => item.id);
  
      await supabase
        .from('likes')
        .update({
          receiver_seen_like: true,
        })
        .in('id', receivedIds);
    }
  
    if (unseenMatches && unseenMatches.length > 0) {
      const senderMatchIds = unseenMatches
        .filter((item) => String(item.sender_profile_id) === String(profileId))
        .map((item) => item.id);
  
      const receiverMatchIds = unseenMatches
        .filter((item) => String(item.receiver_profile_id) === String(profileId))
        .map((item) => item.id);
  
      if (senderMatchIds.length > 0) {
        await supabase
          .from('likes')
          .update({
            sender_seen_match: true,
          })
          .in('id', senderMatchIds);
      }
  
      if (receiverMatchIds.length > 0) {
        await supabase
          .from('likes')
          .update({
            receiver_seen_match: true,
          })
          .in('id', receiverMatchIds);
      }
    }
  } finally {
    isCheckingNotificationsRef.current = false;
  }
  };



  const loadMyReceivedLikes = async (profileId) => {
    if (!profileId) {
      setReceivedLikeIds([]);
      return;
    }
  
    const { data, error } = await supabase
      .from('likes')
      .select('sender_profile_id')
      .eq('receiver_profile_id', profileId)
      .eq('status', 'pending');
  
    if (error) {
      console.error('받은 관심 불러오기 오류:', error);
      alert(`받은 관심 불러오기 오류: ${error.message}`);
      return;
    }
  
    const senderIds = data.map((item) => item.sender_profile_id);
    setReceivedLikeIds(senderIds);
  };



  const loadMyMatches = async (profileId) => {
    if (!profileId) {
      setMatchedProfileIds([]);
      return;
    }
    



    






    const { data: sentAcceptedLikes, error: sentError } = await supabase
      .from('likes')
      .select('receiver_profile_id')
      .eq('sender_profile_id', profileId)
      .eq('status', 'accepted');
  
    if (sentError) {
      console.error('내가 보낸 매칭 불러오기 오류:', sentError);
      alert(`내가 보낸 매칭 불러오기 오류: ${sentError.message}`);
      return;
    }
  







    const { data: receivedAcceptedLikes, error: receivedError } = await supabase
      .from('likes')
      .select('sender_profile_id')
      .eq('receiver_profile_id', profileId)
      .eq('status', 'accepted');
  
    if (receivedError) {
      console.error('내가 받은 매칭 불러오기 오류:', receivedError);
      alert(`내가 받은 매칭 불러오기 오류: ${receivedError.message}`);
      return;
    }
  
    const sentMatchIds = sentAcceptedLikes.map((item) => item.receiver_profile_id);
    const receivedMatchIds = receivedAcceptedLikes.map((item) => item.sender_profile_id);
  
    setMatchedProfileIds([...sentMatchIds, ...receivedMatchIds]);
  };


  const loadContactsForMatches = async (profileIds) => {
    if (!profileIds || profileIds.length === 0) {
      setContactMap({});
      return;
    }
  
    const { data, error } = await supabase
      .from('contacts')
      .select('profile_id, contact_type, contact_value')
      .in('profile_id', profileIds);
  
    if (error) {
      console.error('연락수단 불러오기 오류:', error);
      alert(`연락수단 불러오기 오류: ${error.message}`);
      return;
    }
  
    const newContactMap = {};
  
    data.forEach((contact) => {
      newContactMap[contact.profile_id] = {
        contactType: contact.contact_type,
        contactValue: contact.contact_value,
      };
    });
  
    setContactMap(newContactMap);
  };





  const saveOrUpdateContactToSupabase = async (profileId) => {
    
    
    
      if (!profileId) {
        alert('프로필 정보가 없어 연락수단을 저장할 수 없어요.');
        return false;
      }
    
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .maybeSingle();
    
      if (profileCheckError) {
        console.error('프로필 확인 오류:', profileCheckError);
        alert(`프로필 확인 오류: ${profileCheckError.message}`);
        return false;
      }
    
      if (!existingProfile) {
        alert('현재 프로필 정보를 찾을 수 없어요. 참여 코드로 다시 불러오거나 새 프로필을 만들어주세요.');
    
        localStorage.removeItem('festivalDatingData');
    
        setSupabaseProfileId(null);
        setParticipantCode('');
        setIsEntered(false);
        setIsProfileSaved(false);
        setCurrentPage('profileComplete');
        setStartMode('home');
    
        return false;
      }
    
      // 여기 아래는 기존 연락수단 저장/수정 코드 그대로
    
    
    
    
    
    
    const { error } = await supabase
      .from('contacts')
      .upsert(
        {
          profile_id: profileId,
          contact_type: profile.contactType,
          contact_value: profile.contactValue,
        },
        {
          onConflict: 'profile_id',
        }
      );
  
    if (error) {
      console.error('연락수단 저장/수정 오류:', error);
      alert(`연락수단 저장/수정 오류: ${error.message}`);
      return false;
    }
  
    return true;
  };


  const generateParticipantCode = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
  
    let code = 'MANGO-';
  
    for (let i = 0; i < 3; i += 1) {
      code += letters[Math.floor(Math.random() * letters.length)];
    }
  
    code += '-';
  
    for (let i = 0; i < 4; i += 1) {
      code += numbers[Math.floor(Math.random() * numbers.length)];
    }
  
    return code;
  };


  const scrollToTop = () => {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    }, 0);
  };




  const handleProfileSubmit = async (event) => {
    event.preventDefault();


    if (isSubmittingProfile) {
      return;
    }
  
    





    if (
      !profile.nickname ||
      !profile.gender ||
      !profile.targetGender ||
      !profile.interests ||
      !profile.introduction ||
      !profile.contactValue
    ) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSubmittingProfile(true);


    if (profileFormMode === 'create') {
      setLikeCredits(maxLikes);
      setLastLikeRecoveredAt(new Date().toISOString());
      setLikedProfileIds([]);
    }


    if (!supabaseProfileId) {
      const user = await ensureAnonymousUser();

        if (!user) {
          setIsSubmittingProfile(false);
          return;
        }
      
      
      
      const newParticipantCode = participantCode || generateParticipantCode();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          owner_id: user.id,
          nickname: profile.nickname,
          gender: profile.gender,
          target_gender: profile.targetGender,
          grade: profile.grade || null,
          age: profile.age ? Number(profile.age) : null,
          department: profile.department || null,
          mbti: profile.mbti || null,
          face_type: profile.faceType || null,
          interests: profile.interests,
          introduction: profile.introduction,
          ideal_type: profile.idealType || null,
          egen_teto_score:
            profile.egenTetoScore !== '' ? Number(profile.egenTetoScore) : null,
          is_visible: isProfileVisible,
          participant_code: newParticipantCode,
        })
        .select('id')
        .single();
    
      if (error) {
        console.error('Supabase 저장 오류:', error);
        alert(`Supabase 저장 오류: ${error.message}`);
        setIsSubmittingProfile(false);
        return;
      }
    
      setSupabaseProfileId(data.id);
      setParticipantCode(newParticipantCode);

      setNewProfileNoticeCount(0);
      previousVisibleProfileIdsRef.current = [];
      hasInitializedVisibleProfileIdsRef.current = false;
      skipNextNewProfileNoticeRef.current = true;


      const contactSaved = await saveOrUpdateContactToSupabase(data.id);

      if (!contactSaved) {
        setIsSubmittingProfile(false);
        return;
      }
                
    
    
    
    
    
    } else {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: profile.nickname,
          gender: profile.gender,
          target_gender: profile.targetGender,
          grade: profile.grade || null,
          age: profile.age ? Number(profile.age) : null,
          department: profile.department || null,
          mbti: profile.mbti || null,
          face_type: profile.faceType || null,
          interests: profile.interests,
          introduction: profile.introduction,
          ideal_type: profile.idealType || null,
          egen_teto_score:
            profile.egenTetoScore !== '' ? Number(profile.egenTetoScore) : null,
          is_visible: isProfileVisible,
        })
        .eq('id', supabaseProfileId);
    
      if (error) {
        console.error('Supabase 수정 오류:', error);
        alert(`Supabase 수정 오류: ${error.message}`);
        return;
      }
    
      const contactSaved = await saveOrUpdateContactToSupabase(supabaseProfileId);

      if (!contactSaved) {
        return;
      }
    
    }

    
    await loadSupabaseProfiles();
    
    
    
    
    
    
    
    setIsProfileSaved(true);
    setCurrentPage('profileComplete');
    setProfileFormMode('create');
    setIsSubmittingProfile(false);
    scrollToTop();
  };


  const mbtiFilterOptions = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
  ];
  
  const interestFilterOptions = [
    '영화',
    '음악',
    '게임',
    '운동',
    '카페',
    '맛집',
    '여행',
    '산책',
    '애니',
    '요리',
    '공연/축제',
    '반려동물',
    '그림',
    '춤',
    '노래',
    '패션',
  ];

  const interestEmojiMap = {
    영화: '🍿',
    음악: '🎧',
    게임: '🎮',
    운동: '🏋️',
    카페: '☕',
    맛집: '🍽️',
    여행: '✈️',
    산책: '🚶',
    애니: '📺',
    요리: '🍳',
    '공연/축제': '🎪',
    반려동물: '🐾',
    그림: '🎨',
    춤: '💃',
    노래: '🎤',
    패션: '👗',
  };











  const visibleProfiles = supabaseProfiles.filter((otherProfile) => {
    const isNotMyProfile = String(otherProfile.id) !== String(supabaseProfileId);
    const isVisible = otherProfile.isVisible !== false;
    const isNotMatched = !matchedProfileIds.includes(otherProfile.id);
    const isNotRejected = !rejectedProfileIds.includes(otherProfile.id);
  

    

    const matchesGender =
      profile.targetGender === '상관없음' ||
      otherProfile.gender === profile.targetGender;
  
      const matchesMbti =
      selectedMbtiFilters.length === 0 ||
      selectedMbtiFilters.includes(otherProfile.mbti);
  
    const profileInterests = otherProfile.interests
      ? otherProfile.interests.split(',').map((item) => item.trim())
      : [];
  
    const matchesInterests =
      selectedInterestFilters.length === 0 ||
      selectedInterestFilters.every((interest) =>
        profileInterests.includes(interest)
      );
  
    const hasEgenTetoScore =
      otherProfile.egenTetoScore !== '' &&
      otherProfile.egenTetoScore !== null &&
      otherProfile.egenTetoScore !== undefined &&
      !Number.isNaN(Number(otherProfile.egenTetoScore));
  
    const tetoScore = hasEgenTetoScore
      ? Number(otherProfile.egenTetoScore)
      : null;
  
    const matchesEgenTeto =
      !egenTetoFilter ||
      (egenTetoFilter === 'egen' && hasEgenTetoScore && tetoScore <= 50) ||
      (egenTetoFilter === 'teto' && hasEgenTetoScore && tetoScore >= 50);
  
    const keyword = searchKeyword.trim().toLowerCase();
  
    const searchableText = `
      ${otherProfile.nickname}
      ${otherProfile.gender}
      ${otherProfile.grade}
      ${otherProfile.age}
      ${otherProfile.age ? `${otherProfile.age}세` : ''}
      ${otherProfile.department}
      ${otherProfile.mbti}
      ${otherProfile.faceType}
      ${otherProfile.interests}
      ${otherProfile.introduction}
      ${otherProfile.idealType}
      ${hasEgenTetoScore ? `에겐 ${100 - tetoScore}% 테토 ${tetoScore}%` : ''}
    `.toLowerCase();
  
    const matchesKeyword =
      keyword === '' || searchableText.includes(keyword);
  
    return (
      isNotMyProfile &&
      isVisible &&
      isNotMatched &&
      isNotRejected &&
      matchesGender &&
      matchesMbti &&
      matchesInterests &&
      matchesEgenTeto &&
      matchesKeyword
      
    );
  });
  

  





  const visibleProfileIdKey = visibleProfiles
  .map((item) => String(item.id))
  .join('|');




  const hasVisibleProfiles = visibleProfiles.length > 0;

  const safeBrowseProfileIndex = hasVisibleProfiles
    ? Math.min(browseProfileIndex, visibleProfiles.length - 1)
    : 0;

  const currentBrowseProfile = hasVisibleProfiles
    ? visibleProfiles[safeBrowseProfileIndex]
    : null;

  

  const canGoPreviousProfile = safeBrowseProfileIndex > 0;

  const canGoNextProfile = safeBrowseProfileIndex < visibleProfiles.length - 1;


 

  const receivedProfiles = supabaseProfiles.filter((otherProfile) =>
    receivedLikeIds.includes(otherProfile.id)
  );
  
  const matchedProfiles = supabaseProfiles
  .filter((otherProfile) => matchedProfileIds.includes(otherProfile.id))
  .map((otherProfile) => ({
    ...otherProfile,
    contactType: contactMap[otherProfile.id]?.contactType,
    contactValue: contactMap[otherProfile.id]?.contactValue,
  }));
  


  const toastElement = toastMessage && (
    <div className="toast-layer">
      <div className={`toast-message ${toastType}`}>
        {toastMessage}
      </div>
    </div>
  );

  

  
    const handleToggleLike = async (profileId) => {
      if (processingProfileId === profileId) {
        return;
      }
    
      if (!supabaseProfileId) {
        alert('프로필을 먼저 저장해야 관심을 보낼 수 있어요.');
        return;
      }
  

      const { data: currentProfile, error: currentProfileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', supabaseProfileId)
          .maybeSingle();

      if (currentProfileError) {
        console.error('내 프로필 확인 오류:', currentProfileError);
        alert(`내 프로필 확인 오류: ${currentProfileError.message}`);
        return;
      }

      if (!currentProfile) {
        alert('현재 프로필 정보를 찾을 수 없어요. 참여 코드로 다시 불러오거나 새 프로필을 만들어주세요.');

        localStorage.removeItem('festivalDatingData');

        setSupabaseProfileId(null);
        setParticipantCode('');
        setIsEntered(false);
        setIsProfileSaved(false);
        setCurrentPage('profileComplete');
        setStartMode('home');

        return;
      }





    if (matchedProfileIds.includes(profileId)) {
      alert('이미 매칭된 사람입니다.');
      return;
    }
  
    if (rejectedProfileIds.includes(profileId)) {
      alert('이미 거절된 관심입니다.');
      return;
    }
  
    const alreadyLiked = likedProfileIds.includes(profileId);
    
    if (!alreadyLiked && likeCredits <= 0) {
      alert('지금은 보낼 수 있는 관심이 없어요. 시간이 지나면 다시 회복돼요.');
      return;
    }

    setProcessingProfileId(profileId);

    if (alreadyLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('sender_profile_id', supabaseProfileId)
        .eq('receiver_profile_id', profileId)
        .eq('status', 'pending');
  
        if (error) {
          console.error('관심 취소 오류:', error);
          alert(`관심 취소 오류: ${error.message}`);
          setProcessingProfileId(null);
          return;
        }
  
      setLikedProfileIds((prevIds) =>
        prevIds.filter((id) => id !== profileId)
      );
      
      setLikeCredits((prevCredits) => Math.min(maxLikes, prevCredits + 1));
      setLastLikeRecoveredAt(new Date().toISOString());

      setProcessingProfileId(null);
      return;
    }
  




    const { data: reverseLikes, error: reverseCheckError } = await supabase
  .from('likes')
  .select('id, status')
  .eq('sender_profile_id', profileId)
  .eq('receiver_profile_id', supabaseProfileId);

if (reverseCheckError) {
  console.error('상대 관심 확인 오류:', reverseCheckError);
  alert(`상대 관심 확인 오류: ${reverseCheckError.message}`);
  return;
}

if (reverseLikes.length > 0) {
  const reverseLike = reverseLikes[0];

  if (reverseLike.status === 'pending') {
    
    const { error: acceptError } = await supabase
      .from('likes')
      .update({
        status: 'accepted',
        sender_seen_match: false,
        receiver_seen_match: true,
      })
      .eq('id', reverseLike.id);

    if (acceptError) {
      console.error('자동 매칭 오류:', acceptError);
      alert(`자동 매칭 오류: ${acceptError.message}`);
      return;
    }

    await loadMyReceivedLikes(supabaseProfileId);
    await loadMySentLikes(supabaseProfileId);
    await loadMyMatches(supabaseProfileId);



    setLikeCredits((prevCredits) => {
      if (prevCredits >= maxLikes) {
        setLastLikeRecoveredAt(new Date().toISOString());
      }
    
      return Math.max(0, prevCredits - 1);
    });




    showToast('서로 관심을 보내 매칭되었어요!', 'success');
    setProcessingProfileId(null);
    return;
  }

  if (reverseLike.status === 'accepted') {
    await loadMyMatches(supabaseProfileId);
    alert('이미 매칭된 사람입니다.');
    setProcessingProfileId(null);
    return;
  }
}





   
    const { data: existingLikes, error: checkError } = await supabase
      .from('likes')
      .select('id, status')
      .eq('sender_profile_id', supabaseProfileId)
      .eq('receiver_profile_id', profileId);
  
    if (checkError) {
      console.error('기존 관심 확인 오류:', checkError);
      alert(`기존 관심 확인 오류: ${checkError.message}`);
      setProcessingProfileId(null);
      return;
    }
  
    if (existingLikes.length > 0) {
      const existingLike = existingLikes[0];
  
      if (existingLike.status === 'pending') {
        setLikedProfileIds((prevIds) =>
          prevIds.includes(profileId) ? prevIds : [...prevIds, profileId]
        );
        alert('이미 관심을 보낸 사람입니다.');
        return;
      }
  
      if (existingLike.status === 'accepted') {
        await loadMyMatches(supabaseProfileId);
        alert('이미 매칭된 사람입니다.');
        return;
      }
  
      if (existingLike.status === 'rejected') {
        setRejectedProfileIds((prevIds) =>
          prevIds.includes(profileId) ? prevIds : [...prevIds, profileId]
        );
        alert('이미 거절된 관심입니다.');
        return;
      }
    }
  
    const { error } = await supabase
      .from('likes')
      .insert({
        sender_profile_id: supabaseProfileId,
        receiver_profile_id: profileId,
        status: 'pending',
        receiver_seen_like: false,
      });
  
    if (error) {
      console.error('관심 보내기 오류:', error);
      alert(`관심 보내기 오류: ${error.message}`);
      setProcessingProfileId(null);
      return;
    }
  
    setLikedProfileIds((prevIds) => [...prevIds, profileId]);

    setLikeCredits((prevCredits) => {
      if (prevCredits >= maxLikes) {
        setLastLikeRecoveredAt(new Date().toISOString());
      }

      return Math.max(0, prevCredits - 1);
    });

    setProcessingProfileId(null);
      };

  
  



  const getContactTypeLabel = (contactType) => {
    if (contactType === 'instagram') {
      return '인스타 ID';
    }
  
    if (contactType === 'kakao') {
      return '카카오톡 ID';
    }
  
    if (contactType === 'phone') {
      return '전화번호';
    }
  
    return '기타';
  };






  
  const handleEditProfile = () => {
    setProfileFormMode('edit');
    setIsProfileSaved(false);
  };
  

  const handleToggleProfileVisibility = async () => {
    if (isUpdatingVisibility) {
      return;
    }
  
    const nextVisible = !isProfileVisible;
  
    setIsUpdatingVisibility(true);
  
    try {
      if (supabaseProfileId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_visible: nextVisible,
          })
          .eq('id', supabaseProfileId);
  
        if (error) {
          console.error('프로필 공개 상태 변경 오류:', error);
          alert(`프로필 공개 상태 변경 오류: ${error.message}`);
          return;
        }
      }
  
      setIsProfileVisible(nextVisible);
      await loadSupabaseProfiles();
    } finally {
      setIsUpdatingVisibility(false);
    }
  };








  const handleResetData = async () => {
    if (isDeletingProfile) {
      return;
    }
    
    
    const confirmed = window.confirm(
      '정말 프로필을 삭제할까요?\n\n삭제하면 참여 코드로도 다시 불러올 수 없어요.'
    );
  
    
    
    if (!confirmed) {
      return;
    }
  
    
    if (supabaseProfileId) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', supabaseProfileId);
    
        if (error) {
          console.error('Supabase 삭제 오류:', error);
          alert(`Supabase 삭제 오류: ${error.message}`);
          setIsDeletingProfile(false);
          return;
        }
    
      await loadSupabaseProfiles();
    }
    
    
    
    
    localStorage.removeItem('festivalDatingData');
  
    
    setIsEntered(false);
    
  
    setProfile({
      nickname: '',
      gender: '',
      targetGender: '',
      grade: '',
      age: '',
      department: '',
      mbti: '',
      faceType: '',
      interests: '',
      introduction: '',
      idealType: '',
      egenTetoScore: '',
      contactType: 'instagram',
      contactValue: '',
    });
  
    setIsProfileSaved(false);
    setCurrentPage('profileComplete');
    setSearchKeyword('');
    setLikedProfileIds([]);
    setReceivedLikeIds([1, 2]);
    setMatchedProfileIds([]);
    setIsProfileVisible(true);
    setProfileFormMode('create');
    setSupabaseProfileId(null);
    setParticipantCode('');
    setIsDeletingProfile(false);
  };
  


  const handleAcceptLike = async (profileId) => {
    if (processingReceivedProfileId === profileId) {
      return;
    }
  
    if (!supabaseProfileId) {
      alert('프로필 정보가 없어 수락할 수 없어요.');
      return;
    }
  

    
  
    setProcessingReceivedProfileId(profileId);
    setProcessingReceivedAction('accept');
  
    try {
      const { error } = await supabase
        .from('likes')
        .update({
          status: 'accepted',
          sender_seen_match: false,
          receiver_seen_match: true,
        })
        .eq('sender_profile_id', profileId)
        .eq('receiver_profile_id', supabaseProfileId);
  
      if (error) {
        console.error('관심 수락 오류:', error);
        alert(`관심 수락 오류: ${error.message}`);
        return;
      }
  
      await loadMyReceivedLikes(supabaseProfileId);
      await loadMyMatches(supabaseProfileId);
      showToast('매칭이 성사됐어요!', 'success');
    } finally {
      setProcessingReceivedProfileId(null);
      setProcessingReceivedAction('');
    }
  };



  const handleRejectLike = async (profileId) => {
    if (processingReceivedProfileId === profileId) {
      return;
    }
  
    if (!supabaseProfileId) {
      alert('프로필 정보가 없어 거절할 수 없어요.');
      return;
    }
  
    setProcessingReceivedProfileId(profileId);
    setProcessingReceivedAction('reject');
  
    try {
      const { error } = await supabase
          .from('likes')
          .update({
            status: 'rejected',
            sender_seen_result: false,
          })
          .eq('sender_profile_id', profileId)
          .eq('receiver_profile_id', supabaseProfileId);
          
      if (error) {
        console.error('관심 거절 오류:', error);
        alert(`관심 거절 오류: ${error.message}`);
        return;
      }
  
      await loadMyReceivedLikes(supabaseProfileId);
    } finally {
      setProcessingReceivedProfileId(null);
      setProcessingReceivedAction('');
    }
  };

  const sentLikeProfiles = supabaseProfiles.filter((otherProfile) =>

    likedProfileIds.includes(otherProfile.id)

  );

  const handleInterestFilterToggle = (interest) => {
    setSelectedInterestFilters((prevFilters) =>
      prevFilters.includes(interest)
        ? prevFilters.filter((item) => item !== interest)
        : [...prevFilters, interest]
    );
  };
  
  const clearAllFilters = () => {
    setSelectedMbtiFilters([]);
    setSelectedInterestFilters([]);
    setEgenTetoFilter('');
  };


  const handleMbtiFilterToggle = (mbti) => {
    setSelectedMbtiFilters((prevFilters) =>
      prevFilters.includes(mbti)
        ? prevFilters.filter((item) => item !== mbti)
        : [...prevFilters, mbti]
    );
  };





    const goToPreviousProfile = () => {
      if (visibleProfiles.length <= 1) {
        return;
      }
    
      setBrowseProfileIndex((prevIndex) =>
        prevIndex === 0 ? visibleProfiles.length - 1 : prevIndex - 1
      );
    };
  





    const goToNextProfile = () => {
      if (visibleProfiles.length <= 1) {
        return;
      }
    
      setBrowseProfileIndex((prevIndex) =>
        prevIndex === visibleProfiles.length - 1 ? 0 : prevIndex + 1
      );
    };
    

    const handleProfileTouchStart = (event) => {
      const touch = event.touches[0];
    
      profileTouchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    
      profileTouchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    
      profileSwipeModeRef.current = null;
    };
    
    const handleProfileTouchMove = (event) => {
      const touch = event.touches[0];
    
      profileTouchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    
      const diffX =
        profileTouchEndRef.current.x - profileTouchStartRef.current.x;
    
      const diffY =
        profileTouchEndRef.current.y - profileTouchStartRef.current.y;
    
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
    
      if (!profileSwipeModeRef.current && (absX > 10 || absY > 10)) {
        profileSwipeModeRef.current =
          absX > absY * 1.15 ? 'horizontal' : 'vertical';
      }
    
      if (profileSwipeModeRef.current === 'horizontal') {
        event.preventDefault();
      }
    };
    
    const handleProfileTouchEnd = () => {
      if (profileSwipeModeRef.current !== 'horizontal') {
        return;
      }
    
      const diffX =
        profileTouchEndRef.current.x - profileTouchStartRef.current.x;
    
      const absX = Math.abs(diffX);
      const minSwipeDistance = 55;
    
      if (absX < minSwipeDistance) {
        return;
      }
    
      if (diffX < 0) {
        goToNextProfile();
        return;
      }
    
      goToPreviousProfile();
    };



    const goToNewProfiles = () => {
      setBrowseProfileIndex(0);
      setNewProfileNoticeCount(0);
    
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };

    const renderPageHeader = ({ title, description }) => (
      <div className="app-page-header">
        <h1 className="app-page-title">{title}</h1>
    
        {description && (
          <p className="app-page-description">{description}</p>
        )}
      </div>
    );


 



    if (isProfileSaved && currentPage === 'sentLikes') {
      return (
        <div className="app">
          {toastElement}
    
          {renderPageHeader({
            title: '보낸 관심 관리',
            description: '내가 보낸 관심을 확인하고 취소할 수 있어요.',
          })}
    
    <div className="sent-likes-top-action">
          <button
            type="button"
            className="sent-likes-back-button"
            onClick={() => setCurrentPage('browse')}
          >
            ← 둘러보기
          </button>
        </div>






          {sentLikeProfiles.length === 0 ? (
            <div className="empty-profile-box">
              <p>아직 보낸 관심이 없어요.</p>
              <p>둘러보기에서 마음에 드는 사람에게 관심을 보내보세요.</p>
            </div>
          ) : (
            <div className="sent-likes-list">
              {sentLikeProfiles.map((otherProfile) => (
                <ProfileCard
                  key={otherProfile.id}
                  otherProfile={otherProfile}
                  mode="browse"
                  isLiked={true}
                  isProcessing={processingProfileId === otherProfile.id}
                  onToggleLike={handleToggleLike}
                />
              ))}
            </div>
          )}
    
          
        </div>
      );
    }


  if (isProfileSaved && currentPage === 'browse') {
    return (
      <div className="app browse-page">
        {toastElement}
        {renderPageHeader({
          title: '프로필 둘러보기',
          description: '',
        })}

        <p className="like-count">
          <span className="like-count-icon">♡</span>
          남은 관심 {remainingLikes}회
          <span className="like-recovery-text">
            · {getLikeRecoveryText()}
          </span>
        </p>
        {sentLikeProfiles.length > 0 && (
          <button
          type="button"
          className="sent-likes-shortcut-button"
          onClick={(event) => {
            event.currentTarget.blur();
            setCurrentPage('sentLikes');
          }}
        >
          보낸 관심 {sentLikeProfiles.length}명 관리하기
        </button>
        )}
                
        
        <div className="browse-control-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="키워드 검색 예: 노래, 영화, 운동"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>

          <button
            type="button"
            className={`filter-toggle-button ${
              isFilterOpen ||
              selectedMbtiFilters.length > 0 ||
              selectedInterestFilters.length > 0 ||
              egenTetoFilter
                ? 'active'
                : ''
            }`}
            onClick={(event) => {
              event.currentTarget.blur();
              setIsFilterOpen((prev) => !prev);
            }}
            onPointerUp={(event) => {
              event.currentTarget.blur();
            }}
          >
            필터
          </button>
        </div>


        {(selectedMbtiFilters.length > 0 ||
          selectedInterestFilters.length > 0 ||
          egenTetoFilter) && (
          <div className="active-filter-summary">
            <span>적용 중</span>

            {selectedMbtiFilters.map((mbti) => (
              <button
                key={mbti}
                type="button"
                onClick={(event) => {
                  event.currentTarget.blur();
                  handleMbtiFilterToggle(mbti);
                }}
              >
                {mbti} ×
              </button>
            ))}

            {selectedInterestFilters.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={(event) => {
                  event.currentTarget.blur();
                  handleInterestFilterToggle(interest);
                }}
              >
                {interest} ×
              </button>
            ))}

            {egenTetoFilter && (
              <button
                type="button"
                onClick={(event) => {
                  event.currentTarget.blur();
                  setEgenTetoFilter('');
                }}
              >
                {egenTetoFilter === 'egen' ? '에겐' : '테토'} ×
              </button>
            )}
          </div>
        )}




{isFilterOpen && (
  <div className="filter-section">
    <div className="filter-header">
      <h3>필터</h3>

      {(selectedMbtiFilters.length > 0 ||
        selectedInterestFilters.length > 0 ||
        egenTetoFilter) && (
        <button
          type="button"
          className="filter-reset-button"
          onClick={clearAllFilters}
        >
          초기화
        </button>
      )}
    </div>

    <div className="filter-group">
      <p className="filter-title">MBTI</p>

      <div className="filter-chip-list">
      {mbtiTypes.map((mbti) => (
            <button
              key={mbti}
              type="button"
              className={`filter-chip ${
                selectedMbtiFilters.includes(mbti) ? 'selected' : ''
              }`}
              onClick={(event) => {
                event.currentTarget.blur();
                handleMbtiFilterToggle(mbti);
              }}
            >
              {mbti}
            </button>
          ))}
      </div>
    </div>

    <div className="filter-group">
      <p className="filter-title">관심사</p>

      <div className="filter-chip-list">
      {interestFilterOptions.map((interest) => (
        <button
          key={interest}
          type="button"
          className={`filter-chip ${
            selectedInterestFilters.includes(interest) ? 'selected' : ''
          }`}
          onClick={() => handleInterestFilterToggle(interest)}
        >
          {interestEmojiMap[interest] && (
            <span className="interest-emoji">{interestEmojiMap[interest]}</span>
          )}
          <span>{interest}</span>
        </button>
      ))}
      </div>
    </div>

    <div className="filter-group">
      <p className="filter-title">에겐-테토</p>

      <div className="filter-chip-list">
        <button
          type="button"
          className={`filter-chip ${
            egenTetoFilter === 'egen' ? 'selected' : ''
          }`}
          onClick={() =>
            setEgenTetoFilter((prevFilter) =>
              prevFilter === 'egen' ? '' : 'egen'
            )
          }
        >
          에겐
        </button>

        <button
          type="button"
          className={`filter-chip ${
            egenTetoFilter === 'teto' ? 'selected' : ''
          }`}
          onClick={() =>
            setEgenTetoFilter((prevFilter) =>
              prevFilter === 'teto' ? '' : 'teto'
            )
          }
        >
          테토
        </button>
      </div>
    </div>
  </div>
)}





        <div className="profile-list">
              {!hasVisibleProfiles ? (
        <div className="empty-profile-box">
          <p>조건에 맞는 프로필이 없어요.</p>
          <p>검색어나 필터를 조금 바꿔보세요.</p>
        </div>
      ) : (
        <div className="single-browse-section">
          


          

          {newProfileNoticeCount > 0 && (
            <button
              type="button"
              className="new-profile-notice"
              onClick={goToNewProfiles}
            >
              새 프로필 {newProfileNoticeCount}명 보기
            </button>
          )}
                    
          
          
          
          
          
          <div className="browse-progress">
            <span>
              {safeBrowseProfileIndex + 1} / {visibleProfiles.length}
            </span>
          </div>

          <p className="swipe-guide">
            좌우로 밀어서 넘겨보세요
          </p>



          <div className="browse-card-layout">
          <button
              type="button"
              className="card-side-button card-side-button-prev"
              onClick={(event) => {
                event.currentTarget.blur();
                goToPreviousProfile();
              }}
              onPointerUp={(event) => {
                event.currentTarget.blur();
              }}
              disabled={visibleProfiles.length <= 1}
              aria-label="이전 프로필"
            />

            <div
              className="browse-card-center"
              onTouchStart={handleProfileTouchStart}
              onTouchMove={handleProfileTouchMove}
              onTouchEnd={handleProfileTouchEnd}
            >
              <ProfileCard
                key={currentBrowseProfile.id}
                otherProfile={currentBrowseProfile}
                mode="browse"
                isLiked={likedProfileIds.includes(currentBrowseProfile.id)}
                isProcessing={processingProfileId === currentBrowseProfile.id}
                onToggleLike={handleToggleLike}
              />
            </div>

              <button
                type="button"
                className="card-side-button card-side-button-next"
                onClick={(event) => {
                  event.currentTarget.blur();
                  goToNextProfile();
                }}
                onPointerUp={(event) => {
                  event.currentTarget.blur();
                }}
                disabled={visibleProfiles.length <= 1}
                aria-label="다음 프로필"
              />
            </div>
        </div>
      )}
            
            
            
            
        </div>

        <BottomNav
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          receivedCount={receivedProfiles.length}
          matchCount={matchedProfiles.length}
        />
      </div>
    );
  }

  if (isProfileSaved && currentPage === 'received') {
    return (
      <div className="app">
        {toastElement}
        {renderPageHeader({
            title: '받은 관심',
            description: '나에게 관심을 보낸 사람을 확인해보세요.',
          })}
  
        <div className="profile-list">
          {receivedProfiles.length === 0 && (
            <div className="empty-message">
              아직 받은 관심이 없어요.
            </div>
          )}
            
            {receivedProfiles.map((otherProfile) => (
            <ProfileCard
            key={otherProfile.id}
            otherProfile={otherProfile}
            mode="received"
            isProcessing={processingReceivedProfileId === otherProfile.id}
            processingAction={processingReceivedAction}
            onAcceptLike={handleAcceptLike}
            onRejectLike={handleRejectLike}
          />
          ))}
          
        </div>
  
        <BottomNav
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          receivedCount={receivedProfiles.length}
          matchCount={matchedProfiles.length}
        />
      </div>
    );
  }

  if (isProfileSaved && currentPage === 'matches') {
    return (
      <div className="app">
        {toastElement}
        {renderPageHeader({
          title: '매칭',
          description: '매칭된 사람의 연락수단을 확인할 수 있어요.',
        })}
  
        <div className="profile-list">
          {matchedProfiles.length === 0 && (
            <div className="empty-message">
              아직 매칭된 사람이 없어요.
            </div>
          )}
  
          {matchedProfiles.map((otherProfile) => (
          <ProfileCard
            key={otherProfile.id}
            otherProfile={otherProfile}
            mode="match"
            handleCopyContactValue={handleCopyContactValue}
          />
          ))}
        </div>
  
        <BottomNav
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          receivedCount={receivedProfiles.length}
          matchCount={matchedProfiles.length}
        />
      </div>
    );
  }

  const myInterestEmojiMap = {
    영화: '🍿',
    음악: '🎧',
    게임: '🎮',
    운동: '🏋️',
    카페: '☕',
    맛집: '🍽️',
    여행: '✈️',
    산책: '🚶',
    애니: '📺',
    요리: '🍳',
    '공연/축제': '🎪',
    반려동물: '🐾',
    그림: '🎨',
    춤: '💃',
    노래: '🎤',
    패션: '👗',
  };
  
  const myProfileInterestList = profile.interests
    ? profile.interests.split(',').map((item) => item.trim()).filter(Boolean)
    : [];
  
    const myProfileFaceTypeList = profile.faceType
    ? profile.faceType.split(',').map((item) => item.trim()).filter(Boolean)
    : [];


  const myProfileMetaItems = [
    profile.gender,
    profile.grade,
    profile.age ? `${profile.age}세` : '',
    profile.department ? `🎓 ${profile.department}` : '',
    profile.mbti,
  ].filter(Boolean);
  
  const hasMyEgenTetoScore =
    profile.egenTetoScore !== '' &&
    profile.egenTetoScore !== null &&
    profile.egenTetoScore !== undefined &&
    !Number.isNaN(Number(profile.egenTetoScore));
  
  const myEgenTetoText = hasMyEgenTetoScore
    ? `에겐 ${100 - Number(profile.egenTetoScore)}% · 테토 ${Number(profile.egenTetoScore)}%`
    : '';


    if (isProfileSaved) {
      return (
        <div className="app my-profile-page">
          {toastElement}
    
          {renderPageHeader({
            title: '내 프로필',
            description: '내 정보와 참여 코드를 확인하고 관리할 수 있어요.',
          })}
    

    {participantCode && (
               <section className="my-info-card my-code-card">
                <p className="my-card-title">내 참여 코드</p>
    
                <div className="participant-code-display">
                  {participantCode}
                </div>
    
                <button
                  type="button"
                  className="copy-button"
                  onClick={(event) => {
                    event.currentTarget.blur();
                    handleCopyParticipantCode();
                  }}
                  onPointerUp={(event) => {
                    event.currentTarget.blur();
                  }}
                >
                  코드 복사하기
                </button>
    
                <p className="code-guide">
                  나중에 내 프로필을 다시 불러올 때 필요해요. 캡처하거나 메모해두세요.
                </p>
              </section>
            )}


          <div className="my-profile-layout">
            <section className="my-profile-card">
              <div className="my-profile-header">
                <p className="my-profile-label">내 프로필</p>
                <h2>{profile.nickname}</h2>
    
                {myProfileMetaItems.length > 0 && (
                  <p className="profile-meta">
                    {myProfileMetaItems.join(' · ')}
                  </p>
                )}
              </div>
    
              {(myProfileFaceTypeList.length > 0 || hasMyEgenTetoScore) && (
                <div className="profile-feature-row">
                  {myProfileFaceTypeList.map((faceType) => (
                    <span key={faceType} className="profile-feature-chip">
                      {faceType}
                    </span>
                  ))}

                  {hasMyEgenTetoScore && (
                    <span className="profile-feature-chip egen-teto-chip">
                      <span className="egen-teto-label">에겐</span>
                      <span className="egen-teto-percent">
                        {100 - Number(profile.egenTetoScore)}%
                      </span>

                      <span className="egen-teto-divider">·</span>

                      <span className="egen-teto-label">테토</span>
                      <span className="egen-teto-percent">
                        {Number(profile.egenTetoScore)}%
                      </span>
                    </span>
                  )}
                </div>
              )}
    
              <div className="my-profile-section">
                <p className="profile-section-title">관심사</p>
    
                <div className="profile-interest-list">
                  {myProfileInterestList.map((interest) => (
                    <span key={interest} className="profile-interest-chip">
                      {myInterestEmojiMap[interest] && (
                        <span className="interest-emoji">
                          {myInterestEmojiMap[interest]}
                        </span>
                      )}
                      <span>{interest}</span>
                    </span>
                  ))}
                </div>
              </div>
    
              <div className="my-profile-section">
                <p className="profile-section-title">한줄 소개</p>
                <p className="profile-section-text">{profile.introduction}</p>
              </div>
    
              {profile.idealType && (
                <div className="my-profile-section">
                  <p className="profile-section-title">이상형</p>
                  <p className="profile-section-text">{profile.idealType}</p>
                </div>
              )}
            </section>
    

            <section className="my-info-card">
              <p className="my-card-title">내 연락수단</p>
    
              <div className="contact-value-box">
                <span>{getContactTypeLabel(profile.contactType)}</span>
                <strong>{profile.contactValue}</strong>
              </div>
    
              <p className="contact-guide">
                연락수단은 매칭된 상대에게만 공개돼요.
              </p>
            </section>


            <section className="my-info-card">
              <p className="my-card-title">활동 상태</p>
    
              <p><strong>현재 매칭:</strong> {matchedProfileIds.length}명</p>
              <p><strong>프로필 공개 상태:</strong> {profileStatus}</p>
            </section>
    
            
    
            
    
            <section className="my-profile-actions">
              <p className="my-card-title">프로필 관리</p>

              <button
                type="button"
                className="my-action-button"
                onClick={handleEditProfile}
              >
                프로필 수정하기
              </button>

             
                <button
                  type="button"
                  className="my-action-button"
                  onClick={handleToggleProfileVisibility}
                  disabled={isUpdatingVisibility}
                >
                  {isUpdatingVisibility
                    ? '처리 중...'
                    : isProfileVisible
                      ? '프로필 숨기기'
                      : '다시 공개하기'}
                </button>
             

             
              <button
                type="button"
                className="my-action-button danger"
                onClick={handleResetData}
                disabled={isDeletingProfile}
              >
                {isDeletingProfile ? '삭제 중...' : '프로필 삭제하기'}
              </button>
            </section>
          </div>
    
          <BottomNav
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            receivedCount={receivedProfiles.length}
            matchCount={matchedProfiles.length}
          />
        </div>
      );
    }

    if (isEntered) {
      return (
        <div className="app form-page">
                  {toastElement}

        <div className="form-brand-mini" aria-label="두유는 사랑을 타고">
          <span>
            <strong>두</strong>
            <em>유는</em>
          </span>
          <span>
            <strong>사</strong>
            <em>랑을</em>
          </span>
          <span>
            <strong>타</strong>
            <em>고</em>
          </span>
        </div>

        {renderPageHeader({
          title: profileFormMode === 'edit' ? '프로필 수정' : '프로필 작성',
          description:
            profileFormMode === 'edit'
              ? '수정한 내용을 저장하면 내 프로필에 반영돼요.'
              : '✨ 자세히 작성할수록 매칭에 도움이 돼요.',
        })}


        <div className="form-top-action">
          <button
            type="button"
            className="form-cancel-button"
            onClick={handleCancelProfileForm}
          >
            {profileFormMode === 'edit' ? '수정 취소' : '첫 화면으로 돌아가기'}
          </button>
        </div>



            <div className="profile-form-shell">
            <ProfileForm
              profile={profile}
              profileFormMode={profileFormMode}
              isSubmittingProfile={isSubmittingProfile}
              onProfileChange={handleProfileChange}
              onProfileSubmit={handleProfileSubmit}
            />
          </div>
      </div>
    );
  }

  return (
    <div className="app start-page">
      {toastElement}

        <div className="start-hero">
          <p className="start-brand" aria-label="두유는 사랑을 타고">
            <span className="brand-word">
              <span className="brand-main">두</span>
              <span className="brand-sub">유는</span>
            </span>

            <span className="brand-word">
              <span className="brand-main">사</span>
              <span className="brand-sub">랑을</span>
            </span>

            <span className="brand-word">
              <span className="brand-main">타</span>
              <span className="brand-sub">고</span>
            </span>
          </p>

          <h1 className="start-title">
           가볍게 둘러보고<br />
           마음이 가면 관심 보내기
          </h1>

          <p className="start-description">
            매칭이 된 경우에만 연락수단이 공개돼요.
          </p>
        </div>

        {startMode === 'home' && (
          <div className="start-card">
            <div className="start-card-header">
              
              <p>
                 참여 코드를 저장해두면<br /> 
                 나중에 내 프로필을 다시 불러올 수 있어요.
              </p>
            </div>

            <div className="start-action-box">
              <button
                type="button"
                className="start-primary-button"
                onClick={handleStartNewProfile}
              >
                프로필 만들기
              </button>

              <button
                type="button"
                className="start-secondary-button"
                onClick={() => setStartMode('lookup')}
              >
                내 프로필 불러오기
              </button>
            </div>
          </div>
        )}

        {startMode === 'lookup' && (
          <div className="start-card">
            <div className="start-card-header">
              <h2>내 프로필 불러오기</h2>
              <p>프로필을 만들 때 발급받은 참여 코드를 입력해주세요.</p>
            </div>

            <input
              className="lookup-code-input"
              type="text"
              placeholder="예: MANGO-ABC-2345"
              value={lookupCode}
              onChange={(event) => setLookupCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !isLoadingProfile) {
                  handleLoadProfileByCode();
                }
              }}
            />

            <div className="start-action-box">
              <button
                type="button"
                className="start-primary-button"
                onClick={handleLoadProfileByCode}
                disabled={isLoadingProfile}
              >
                {isLoadingProfile ? '불러오는 중...' : '불러오기'}
              </button>

              <button
                type="button"
                className="start-secondary-button"
                onClick={() => setStartMode('home')}
              >
                돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
  );
}

export default App;