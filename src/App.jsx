import { useEffect, useState } from 'react';
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
      department: '',
      mbti: '',
      interests: '',
      introduction: '',
      idealType: '',
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


  const maxLikes = 3;
  const remainingLikes = maxLikes - likedProfileIds.length;
  const [receivedLikeIds, setReceivedLikeIds] = useState([]);
  const [matchedProfileIds, setMatchedProfileIds] = useState(savedData.matchedProfileIds || []);
  
  const [isProfileVisible, setIsProfileVisible] = useState(savedData.isProfileVisible ?? true);
  const [supabaseProfileId, setSupabaseProfileId] = useState(savedData.supabaseProfileId || null);
  const [participantCode, setParticipantCode] = useState(savedData.participantCode || '');
  const [startMode, setStartMode] = useState('home');
  const [lookupCode, setLookupCode] = useState('');
  const [supabaseProfiles, setSupabaseProfiles] = useState([]);
  const [contactMap, setContactMap] = useState({});


  const maxMatches = 3;
  const isMatchFull = matchedProfileIds.length >= maxMatches;
  const profileStatus = isProfileVisible && !isMatchFull ? '공개 중' : '숨김';

  useEffect(() => {
    const dataToSave = {
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
    if (supabaseProfileId) {
      loadMySentLikes(supabaseProfileId);
      loadMyReceivedLikes(supabaseProfileId);
      loadMyMatches(supabaseProfileId);
    }
  }, [supabaseProfileId]);


  useEffect(() => {
    const autoHideProfileIfMatchFull = async () => {
      if (!supabaseProfileId) {
        return;
      }
  
      if (matchedProfileIds.length >= maxMatches && isProfileVisible) {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_visible: false,
          })
          .eq('id', supabaseProfileId);
  
        if (error) {
          console.error('자동 프로필 숨김 오류:', error);
          alert(`자동 프로필 숨김 오류: ${error.message}`);
          return;
        }
  
        setIsProfileVisible(false);
        await loadSupabaseProfiles();
      }
    };
  
    autoHideProfileIfMatchFull();
  }, [matchedProfileIds, supabaseProfileId, isProfileVisible]);
  




  useEffect(() => {
    loadContactsForMatches(matchedProfileIds);
  }, [matchedProfileIds]);



  
  

  


  const handleStartNewProfile = () => {
    setIsEntered(true);
    setIsProfileSaved(false);
    setProfileFormMode('create');
    setCurrentPage('profileComplete');
  };


  const handleLoadProfileByCode = async () => {
    const code = lookupCode.trim().toUpperCase();
  
    if (!code) {
      alert('참여 코드를 입력해주세요.');
      return;
    }
  
    const { data: foundProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('participant_code', code)
      .maybeSingle();
  
    if (profileError) {
      console.error('프로필 불러오기 오류:', profileError);
      alert(`프로필 불러오기 오류: ${profileError.message}`);
      return;
    }
  
    if (!foundProfile) {
      alert('해당 참여 코드로 등록된 프로필을 찾을 수 없어요.');
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
      return;
    }
  
    setProfile({
      nickname: foundProfile.nickname,
      gender: foundProfile.gender,
      targetGender: foundProfile.target_gender,
      grade: foundProfile.grade,
      department: foundProfile.department || '',
      mbti: foundProfile.mbti || '',
      interests: foundProfile.interests,
      introduction: foundProfile.introduction,
      idealType: foundProfile.ideal_type || '',
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
  
    await loadSupabaseProfiles();
    await loadMySentLikes(foundProfile.id);
    await loadMyReceivedLikes(foundProfile.id);
    await loadMyMatches(foundProfile.id);
  };





  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile({
      ...profile,
      [name]: value,
    });
  };


  const loadSupabaseProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('프로필 불러오기 오류:', error);
      alert(`프로필을 불러오는 중 오류가 발생했어요: ${error.message}`);
      return;
    }
  
    const formattedProfiles = data.map((item) => ({
      id: item.id,
      nickname: item.nickname,
      gender: item.gender,
      targetGender: item.target_gender,
      grade: item.grade,
      department: item.department,
      mbti: item.mbti,
      interests: item.interests,
      introduction: item.introduction,
      idealType: item.ideal_type,
      isVisible: item.is_visible,
      participantCode: item.participant_code,
    }));
  
    setSupabaseProfiles(formattedProfiles);
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







  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (
      !profile.nickname ||
      !profile.gender ||
      !profile.targetGender ||
      !profile.grade ||
      !profile.interests ||
      !profile.introduction ||
      !profile.contactValue
    ) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!supabaseProfileId) {
      
      const newParticipantCode = participantCode || generateParticipantCode();
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          nickname: profile.nickname,
          gender: profile.gender,
          target_gender: profile.targetGender,
          grade: profile.grade,
          department: profile.department || null,
          mbti: profile.mbti || null,
          interests: profile.interests,
          introduction: profile.introduction,
          ideal_type: profile.idealType || null,
          is_visible: isProfileVisible,
          participant_code: newParticipantCode,
        })
        .select('id')
        .single();
    
      if (error) {
        console.error('Supabase 저장 오류:', error);
        alert(`Supabase 저장 오류: ${error.message}`);
        return;
      }
    
      setSupabaseProfileId(data.id);
      setParticipantCode(newParticipantCode);

      const contactSaved = await saveOrUpdateContactToSupabase(data.id);

      if (!contactSaved) {
        return;
      }
                
    
    
    
    
    
    } else {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: profile.nickname,
          gender: profile.gender,
          target_gender: profile.targetGender,
          grade: profile.grade,
          department: profile.department || null,
          mbti: profile.mbti || null,
          interests: profile.interests,
          introduction: profile.introduction,
          ideal_type: profile.idealType || null,
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
  };

  const visibleProfiles = supabaseProfiles.filter((otherProfile) => {
    const isNotMyProfile = String(otherProfile.id) !== String(supabaseProfileId); 
    const isVisible = otherProfile.isVisible !== false;
    const isNotMatched = !matchedProfileIds.includes(otherProfile.id);
    const isNotRejected = !rejectedProfileIds.includes(otherProfile.id);
    
    const matchesGender =
      profile.targetGender === '상관없음' ||
      otherProfile.gender === profile.targetGender;
  



    const keyword = searchKeyword.trim().toLowerCase();
  
    const searchableText = `
      ${otherProfile.nickname}
      ${otherProfile.department}
      ${otherProfile.mbti}
      ${otherProfile.interests}
      ${otherProfile.introduction}
      ${otherProfile.idealType}
    `.toLowerCase();
  
    const matchesKeyword =
      keyword === '' || searchableText.includes(keyword);
  
      return (
        isNotMyProfile &&
        isVisible &&
        isNotMatched &&
        isNotRejected &&
        matchesGender &&
        matchesKeyword
      );
  });
  
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
  




  const handleToggleLike = async (profileId) => {
    if (!supabaseProfileId) {
      alert('프로필을 먼저 저장해야 관심을 보낼 수 있어요.');
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
        return;
      }
  
      setLikedProfileIds((prevIds) =>
        prevIds.filter((id) => id !== profileId)
      );
  
      return;
    }
  
    if (likedProfileIds.length >= maxLikes) {
      alert('관심은 최대 3명까지만 보낼 수 있어요.');
      return;
    }
  
    const { data: existingLikes, error: checkError } = await supabase
      .from('likes')
      .select('id, status')
      .eq('sender_profile_id', supabaseProfileId)
      .eq('receiver_profile_id', profileId);
  
    if (checkError) {
      console.error('기존 관심 확인 오류:', checkError);
      alert(`기존 관심 확인 오류: ${checkError.message}`);
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
      });
  
    if (error) {
      console.error('관심 보내기 오류:', error);
      alert(`관심 보내기 오류: ${error.message}`);
      return;
    }
  
    setLikedProfileIds((prevIds) => [...prevIds, profileId]);
  };

  
  



  const getContactTypeLabel = (contactType) => {
    if (contactType === 'instagram') {
      return '인스타그램';
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
    const nextVisible = !isProfileVisible;
  
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
  };









  const handleResetData = async () => {
    const confirmed = window.confirm('프로필과 매칭 정보를 모두 삭제할까요?');
  
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
      department: '',
      mbti: '',
      interests: '',
      introduction: '',
      idealType: '',
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
  };
  


  const handleAcceptLike = async (profileId) => {
    if (!supabaseProfileId) {
      alert('프로필 정보가 없어 수락할 수 없어요.');
      return;
    }
  
    if (matchedProfileIds.length >= maxMatches) {
      alert('매칭은 최대 3명까지만 가능해요.');
      return;
    }
  
    const { error } = await supabase
      .from('likes')
      .update({
        status: 'accepted',
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
  };




  const handleRejectLike = async (profileId) => {
    if (!supabaseProfileId) {
      alert('프로필 정보가 없어 거절할 수 없어요.');
      return;
    }
  
    const { error } = await supabase
      .from('likes')
      .update({
        status: 'rejected',
      })
      .eq('sender_profile_id', profileId)
      .eq('receiver_profile_id', supabaseProfileId);
  
    if (error) {
      console.error('관심 거절 오류:', error);
      alert(`관심 거절 오류: ${error.message}`);
      return;
    }
  
    await loadMyReceivedLikes(supabaseProfileId);
  };





  




  if (isProfileSaved && currentPage === 'browse') {
    return (
      <div className="app">
        <h1>프로필 둘러보기</h1>
        <p>마음에 드는 사람에게 관심을 보내보세요.</p>
        <p className="like-count">남은 관심: {remainingLikes}회</p>
        <div className="search-box">
          <input
            type="text"
            placeholder="키워드 검색 예: 노래, 영화, 운동"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </div>



        <div className="profile-list">
            {visibleProfiles.length === 0 && (
                <div className="empty-message">
                    조건에 맞는 프로필이 없어요.
                </div>
            )}

            
            {visibleProfiles.map((otherProfile) => (
              <ProfileCard
                key={otherProfile.id}
                otherProfile={otherProfile}
                mode="browse"
                isLiked={likedProfileIds.includes(otherProfile.id)}
                onToggleLike={handleToggleLike}
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

  if (isProfileSaved && currentPage === 'received') {
    return (
      <div className="app">
        <h1>받은 관심</h1>
        <p>나에게 관심을 보낸 사람들을 확인할 수 있어요.</p>
  
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
        <h1>매칭</h1>
        <p>매칭된 사람의 연락수단을 확인할 수 있어요.</p>
  
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




  if (isProfileSaved) {
    return (
      <div className="app">
        <h1>프로필 작성 완료</h1>
        <p>이제 다른 사람들의 프로필을 둘러볼 수 있어요.</p>

        <div className="card">
          <h2>{profile.nickname}님의 프로필</h2>

          <div className="profile-summary">
            <p><strong>성별:</strong> {profile.gender}</p>
            
            <p><strong>학년:</strong> {profile.grade}</p>
            {profile.department && <p><strong>학과:</strong> {profile.department}</p>}
            {profile.mbti && <p><strong>MBTI:</strong> {profile.mbti}</p>}
            <p><strong>관심사:</strong> {profile.interests}</p>
            <p><strong>자기소개:</strong> {profile.introduction}</p>
            {profile.idealType && <p><strong>이상형:</strong> {profile.idealType}</p>}
          </div>

          <div className="status-box">
            <p><strong>매칭 현황:</strong> {matchedProfileIds.length} / {maxMatches}</p>
            <p><strong>프로필 상태:</strong> {profileStatus}</p>

            {isMatchFull && (
              <p className="status-message">매칭 가능 인원이 가득 찼어요.</p>
            )}
          </div>



          {participantCode && (
              <div className="code-box">
                <p><strong>내 참여 코드</strong></p>
                <p className="participant-code">{participantCode}</p>
                <p className="code-guide">
                  나중에 내 프로필을 다시 불러올 때 필요해요. 캡처하거나 메모해두세요.
                </p>
              </div>
            )}








          <div className="contact-box">
            <p><strong>내 연락수단</strong></p>
            <p>
              {getContactTypeLabel(profile.contactType)}: {profile.contactValue}
            </p>
            <p className="contact-guide">
              매칭된 상대에게만 공개돼요.
            </p>
          </div>







          {!isMatchFull && (
            <button
              className="sub-button"
              onClick={handleToggleProfileVisibility}
            >
              {isProfileVisible ? '프로필 숨기기' : '다시 공개하기'}
            </button>
          )}




          <button onClick={handleEditProfile}>프로필 수정하기</button>
          <button onClick={() => setCurrentPage('browse')}>프로필 둘러보기</button>
          <button className="delete-button" onClick={handleResetData}>
            프로필 삭제하기
          </button>



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
      <div className="app">
        <h1>{profileFormMode === 'edit' ? '프로필 수정' : '프로필 작성'}</h1>
        <p>
            {profileFormMode === 'edit'
              ? '수정한 내용을 저장하면 내 프로필에 반영돼요.'
              : '프로필을 작성하고 마음에 드는 사람에게 관심을 보내보세요.'}
        </p>

        <ProfileForm
          profile={profile}
          profileFormMode={profileFormMode}
          onProfileChange={handleProfileChange}
          onProfileSubmit={handleProfileSubmit}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <h1>축제 매칭 웹</h1>
      <p>학교 축제 현장에서 만나는 새로운 인연</p>
  
      {startMode === 'home' && (
        <div className="card">
          <h2>참여 방법</h2>
          <p>
            처음 참여하는 경우 프로필을 만들고, 이미 참여했다면 참여 코드로
            내 프로필을 다시 불러올 수 있어요.
          </p>
  
          <button onClick={handleStartNewProfile}>
            처음 참여하기
          </button>
  
          <button
            className="sub-button"
            onClick={() => setStartMode('lookup')}
          >
            내 프로필 불러오기
          </button>
        </div>
      )}
  
      {startMode === 'lookup' && (
        <div className="card">
          <h2>내 프로필 불러오기</h2>
          <p>프로필 저장 후 발급받은 참여 코드를 입력해주세요.</p>
  
          <input
            type="text"
            placeholder="예: MANGO-ABC-2345"
            value={lookupCode}
            onChange={(event) => setLookupCode(event.target.value.toUpperCase())}
          />
  
            <button onClick={handleLoadProfileByCode}>
            불러오기
          </button>
            
          <button
            className="sub-button"
            onClick={() => setStartMode('home')}
          >
            돌아가기
          </button>
        </div>
      )}
    </div>
  );
}

export default App;