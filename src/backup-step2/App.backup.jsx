import { useEffect, useState } from 'react';
import './App.css';
import { sampleProfiles } from './data/sampleProfiles';
import BottomNav from './components/BottomNav';
import ProfileCard from './components/ProfileCard';
import ProfileForm from './components/ProfileForm';



function App() {
  const savedData = JSON.parse(localStorage.getItem('festivalDatingData')) || {};
  const [accessCode, setAccessCode] = useState('');
  const [isEntered, setIsEntered] = useState(savedData.isEntered || false);
  const [errorMessage, setErrorMessage] = useState('');



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
  const [profileFormMode, setProfileFormMode] = useState('create');


  const maxLikes = 3;
  const remainingLikes = maxLikes - likedProfileIds.length;
  const [receivedLikeIds, setReceivedLikeIds] = useState(savedData.receivedLikeIds || [1, 2]);
  const [matchedProfileIds, setMatchedProfileIds] = useState(savedData.matchedProfileIds || []);
  
  const [isProfileVisible, setIsProfileVisible] = useState(savedData.isProfileVisible ?? true);

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
  ]);





  
  const correctCode = 'FESTA2026';

  const handleEnter = () => {
    const userCode = accessCode.trim().toUpperCase();

    if (userCode === correctCode) {
      setIsEntered(true);
      setErrorMessage('');
    } else {
      setErrorMessage('입장코드가 올바르지 않습니다.');
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile({
      ...profile,
      [name]: value,
    });
  };

  const handleProfileSubmit = (event) => {
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

    setIsProfileSaved(true);
    setCurrentPage('profileComplete');
    setProfileFormMode('create');
  };

  const visibleProfiles = sampleProfiles.filter((otherProfile) => {
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
  
    return matchesGender && matchesKeyword;
  });
  
  const receivedProfiles = sampleProfiles.filter((otherProfile) =>
    receivedLikeIds.includes(otherProfile.id)
  );
  
  const matchedProfiles = sampleProfiles.filter((otherProfile) =>
    matchedProfileIds.includes(otherProfile.id)
  );
  




  const handleToggleLike = (profileId) => {
    const alreadyLiked = likedProfileIds.includes(profileId);
  
    if (alreadyLiked) {
      const newLikedProfileIds = likedProfileIds.filter((id) => id !== profileId);
      setLikedProfileIds(newLikedProfileIds);
      return;
    }
  
    if (likedProfileIds.length >= maxLikes) {
      alert('관심은 최대 3명까지만 보낼 수 있어요.');
      return;
    }
  
    setLikedProfileIds([...likedProfileIds, profileId]);
  };

  const handleEditProfile = () => {
    setProfileFormMode('edit');
    setIsProfileSaved(false);
  };
  
  const handleResetData = () => {
    const confirmed = window.confirm('프로필과 매칭 정보를 모두 삭제할까요?');
  
    if (!confirmed) {
      return;
    }
  
    localStorage.removeItem('festivalDatingData');
  
    setAccessCode('');
    setIsEntered(false);
    setErrorMessage('');
  
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
  };
  


  const handleAcceptLike = (profileId) => {
    if (matchedProfileIds.length >= maxMatches) {
      alert('매칭은 최대 3명까지만 가능해요.');
      return;
    }
  
    setReceivedLikeIds((prevIds) =>
      prevIds.filter((id) => id !== profileId)
    );
  
    setMatchedProfileIds((prevIds) => {
      if (prevIds.includes(profileId)) {
        return prevIds;
      }
  
      return [...prevIds, profileId];
    });
  };
  
  const handleRejectLike = (profileId) => {
    setReceivedLikeIds((prevIds) =>
      prevIds.filter((id) => id !== profileId)
    );
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

        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
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
  
        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
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
  
        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
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

          {!isMatchFull && (
            <button
                className="sub-button"
                onClick={() => setIsProfileVisible(!isProfileVisible)}
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
        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
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

      <div className="card">
        <h2>입장코드 입력</h2>
        <p>부스에서 안내받은 입장코드를 입력해주세요.</p>

        <input
          type="text"
          placeholder="예: FESTA2026"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
        />

        <button onClick={handleEnter}>입장하기</button>

        {errorMessage && <p className="error">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default App;