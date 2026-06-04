import { useState } from 'react';

function ProfileForm({
  profile,
  profileFormMode,
  isSubmittingProfile,
  onProfileChange,
  onProfileSubmit,
}) {


  const mbtiTypes = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
  ];
  


  const faceTypeOptions = [
    '🐶 강아지상',
    '🐱 고양이상',
    '🦊 여우상',
    '🐻 곰상',
    '🐰 토끼상',
    '🦖 공룡상',
    '🐹 햄스터상',
    '🐿️ 다람쥐상',
    '🦫 카피바라상',
    '🐢 꼬부기상',
    '🐺 늑대상',
  ];
  
  const handleFaceTypeSelect = (faceType) => {
    const selectedFaceTypes = profile.faceType
      ? profile.faceType.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
  
    const isAlreadySelected = selectedFaceTypes.includes(faceType);
  
    const nextSelectedFaceTypes = isAlreadySelected
      ? selectedFaceTypes.filter((item) => item !== faceType)
      : selectedFaceTypes.length >= 2
        ? selectedFaceTypes
        : [...selectedFaceTypes, faceType];
  
    onProfileChange({
      target: {
        name: 'faceType',
        value: nextSelectedFaceTypes.join(', '),
      },
    });
  };




  const defaultInterestTags = [
    { label: '영화', emoji: '🍿' },
    { label: '음악', emoji: '🎧' },
    { label: '게임', emoji: '🎮' },
    { label: '운동', emoji: '🏋️' },
    { label: '카페', emoji: '☕' },
    { label: '맛집', emoji: '🍽️' },
    { label: '여행', emoji: '✈️' },
    { label: '산책', emoji: '🚶' },
    { label: '애니', emoji: '📺' },
    { label: '요리', emoji: '🍳' },
    { label: '공연/축제', emoji: '🎪' },
    { label: '반려동물', emoji: '🐾' },
    { label: '그림', emoji: '🎨' },
    { label: '춤', emoji: '💃' },
    { label: '노래', emoji: '🎤' },
    { label: '패션', emoji: '👗' },
  ];
  
  const [customInterest, setCustomInterest] = useState('');

  const selectedInterests = profile.interests
  ? profile.interests.split(',').map((item) => item.trim()).filter(Boolean)
  : [];

  const updateInterests = (nextInterests) => {
    onProfileChange({
      target: {
        name: 'interests',
        value: nextInterests.join(', '),
      },
    });
  };
  


  const getEgenTetoLabel = (score) => {
    if (score === '' || score === null || score === undefined) {
      return '';
    }
  
    const tetoPercent = Number(score);
    const egenPercent = 100 - tetoPercent;
  
    return `에겐 ${egenPercent}% · 테토 ${tetoPercent}%`;
  };
  
  const handleEgenTetoChange = (event) => {
    onProfileChange({
      target: {
        name: 'egenTetoScore',
        value: event.target.value,
      },
    });
  };
  
  const clearEgenTeto = () => {
    onProfileChange({
      target: {
        name: 'egenTetoScore',
        value: '',
      },
    });
  };





  const getContactPlaceholder = () => {
    if (profile.contactType === 'instagram') {
      return '예: @mango_123';
    }
  
    if (profile.contactType === 'kakao') {
      return '예: 카카오톡 ID';
    }
  
    if (profile.contactType === 'phone') {
      return '예: 010-0000-0000';
    }
  
    return '연락 가능한 수단을 입력해주세요';
  };




  const handleInterestToggle = (interest) => {
    const isSelected = selectedInterests.includes(interest);
  
    const nextInterests = isSelected
      ? selectedInterests.filter((item) => item !== interest)
      : [...selectedInterests, interest];
  
    updateInterests(nextInterests);
  };


  const handleAddCustomInterest = () => {
    const trimmedInterest = customInterest.trim();
  
    if (!trimmedInterest) {
      return;
    }
  
    if (selectedInterests.includes(trimmedInterest)) {
      setCustomInterest('');
      return;
    }
  
    updateInterests([...selectedInterests, trimmedInterest]);
    setCustomInterest('');
  };





  const handleMbtiSelect = (mbti) => {
    const nextValue = profile.mbti === mbti ? '' : mbti;
  
    onProfileChange({
      target: {
        name: 'mbti',
        value: nextValue,
      },
    });
  };



  
  return (
   <form className="profile-form" onSubmit={onProfileSubmit}>
  <div className="form-notice-card">
    <p>연락수단은 매칭된 상대에게만 공개돼요.</p>
    <p>관심을 보내고 상대방이 수락하면 매칭됩니다.</p>
  </div>

  <section className="form-section">
    <div className="form-section-header">
      <p className="form-section-title">기본 정보</p>
      <p className="form-section-description">
        프로필에 표시될 기본 정보를 입력해주세요.
      </p>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>닉네임</span>
        <span className="field-badge required">필수</span>
      </label>

      <input
        type="text"
        name="nickname"
        placeholder="예: 망고"
        value={profile.nickname}
        onChange={onProfileChange}
      />
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>성별</span>
        <span className="field-badge required">필수</span>
      </label>

      <select
        name="gender"
        value={profile.gender}
        onChange={onProfileChange}
      >
        <option value="">선택해주세요</option>
        <option value="남성">남성</option>
        <option value="여성">여성</option>
      </select>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>매칭 희망 성별</span>
        <span className="field-badge required">필수</span>
      </label>

      <select
        name="targetGender"
        value={profile.targetGender}
        onChange={onProfileChange}
      >
        <option value="">선택해주세요</option>
        <option value="남성">남성</option>
        <option value="여성">여성</option>
        <option value="상관없음">상관없음</option>
      </select>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>학년</span>
        <span className="field-badge optional">선택</span>
      </label>

      <select
        name="grade"
        value={profile.grade}
        onChange={onProfileChange}
      >
        <option value="">선택하지 않음</option>
        <option value="1학년">1학년</option>
        <option value="2학년">2학년</option>
        <option value="3학년">3학년</option>
        <option value="4학년">4학년</option>
        <option value="졸업생">졸업생</option>
      </select>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>나이</span>
        <span className="field-badge optional">선택</span>
      </label>

      <input
        type="number"
        name="age"
        placeholder="선택 입력 예: 22"
        value={profile.age}
        onChange={onProfileChange}
        min="18"
        max="99"
      />
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>학과</span>
        <span className="field-badge optional">선택</span>
      </label>

      <input
        type="text"
        name="department"
        placeholder="선택 입력"
        value={profile.department}
        onChange={onProfileChange}
      />
    </div>
  </section>

  <section className="form-section">
    <div className="form-section-header">
      <p className="form-section-title">취향 정보</p>
      <p className="form-section-description">
        나를 조금 더 잘 보여줄 수 있는 취향을 선택해주세요.
      </p>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>MBTI</span>
        <span className="field-badge optional">선택</span>
      </label>

      <div className="mbti-grid">
        {mbtiTypes.map((mbti) => (
          <button
          key={mbti}
          type="button"
          className={`mbti-button ${profile.mbti === mbti ? 'selected' : ''}`}
          onClick={(event) => {
            event.currentTarget.blur();
            handleMbtiSelect(mbti);
          }}
          onPointerUp={(event) => {
            event.currentTarget.blur();
          }}
        >
          {mbti}
        </button>
        ))}
      </div>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>얼굴상</span>
        <span className="field-badge optional">선택</span>
      </label>
      
      <p className="field-help-text">
          최대 2개까지 선택할 수 있어요.
        </p>





      <div className="face-type-grid">
        {faceTypeOptions.map((faceType) => {
          const selectedFaceTypes = profile.faceType
            ? profile.faceType.split(',').map((item) => item.trim()).filter(Boolean)
            : [];

          const isSelected = selectedFaceTypes.includes(faceType);
          const isDisabled = !isSelected && selectedFaceTypes.length >= 2;

          return (
            <button
              key={faceType}
              type="button"
              className={`face-type-button ${isSelected ? 'selected' : ''}`}
              onClick={(event) => {
                event.currentTarget.blur();
                handleFaceTypeSelect(faceType);
              }}
              onPointerUp={(event) => {
                event.currentTarget.blur();
              }}
              disabled={isDisabled}
            >
              {faceType}
            </button>
          );
        })}
      </div>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>에겐-테토 성향</span>
        <span className="field-badge optional">선택</span>
      </label>

      <div className="egen-teto-box">
        <div className="egen-teto-label-row">
          <span>에겐</span>
          <span>테토</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={profile.egenTetoScore === '' ? 50 : profile.egenTetoScore}
          onChange={handleEgenTetoChange}
          className="egen-teto-slider"
        />

        {profile.egenTetoScore !== '' && (
          <p className="egen-teto-result">
            {getEgenTetoLabel(profile.egenTetoScore)}
          </p>
        )}

        {profile.egenTetoScore !== '' && (
          <button
            type="button"
            className="clear-small-button"
            onClick={clearEgenTeto}
          >
            선택 해제
          </button>
        )}
      </div>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>관심사</span>
        <span className="field-badge required">필수</span>
      </label>

      <div className="interest-tag-grid">
        {defaultInterestTags.map((interest) => (
          <button
              key={interest.label}
              type="button"
              className={`interest-tag-button ${
                selectedInterests.includes(interest.label) ? 'selected' : ''
              }`}
              onClick={(event) => {
                event.currentTarget.blur();
                handleInterestToggle(interest.label);
              }}
              onPointerUp={(event) => {
                event.currentTarget.blur();
              }}
            >
            <span className="interest-emoji">{interest.emoji}</span>
            <span>{interest.label}</span>
          </button>
        ))}
      </div>

      <div className="custom-interest-row">
        <input
          type="text"
          placeholder="직접 추가 예: 드라이브"
          value={customInterest}
          onChange={(event) => setCustomInterest(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAddCustomInterest();
            }
          }}
        />

        <button
          type="button"
          className="add-interest-button"
          onClick={handleAddCustomInterest}
        >
          추가
        </button>
      </div>

      {selectedInterests.length > 0 && (
        <div className="selected-interest-box">
          <p>선택한 관심사</p>

          <div className="selected-interest-list">
            {selectedInterests.map((interest) => (
              <button
                key={interest}
                type="button"
                className="selected-interest-chip"
                onClick={(event) => {
                  event.currentTarget.blur();
                  handleInterestToggle(interest);
                }}
                onPointerUp={(event) => {
                  event.currentTarget.blur();
                }}
              >
                {interest} ×
            </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>

  <section className="form-section">
    <div className="form-section-header">
      <p className="form-section-title">소개</p>
      <p className="form-section-description">
        상대가 나를 조금 더 편하게 이해할 수 있도록 적어주세요.
      </p>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>한줄 소개</span>
        <span className="field-badge required">필수</span>
      </label>

      <textarea
        name="introduction"
        placeholder="예: 카페 가는 거 좋아하고 편하게 대화하는 걸 좋아해요."
        value={profile.introduction}
        onChange={onProfileChange}
      />
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>이상형</span>
        <span className="field-badge optional">선택</span>
      </label>

      <textarea
        name="idealType"
        placeholder="예: 대화가 잘 통하고 편하게 웃을 수 있는 사람"
        value={profile.idealType}
        onChange={onProfileChange}
      />
    </div>
  </section>

  <section className="form-section">
    <div className="form-section-header">
      <p className="form-section-title">연락수단</p>
      <p className="form-section-description">
        연락수단은 서로 매칭된 상대에게만 공개돼요.
      </p>
    </div>

    <div className="form-field">
      <label className="field-label">
        <span>연락수단</span>
        <span className="field-badge required">필수</span>
      </label>

      <div className="contact-input-group">
        <select
          name="contactType"
          value={profile.contactType}
          onChange={onProfileChange}
          className="contact-type-select"
        >
          <option value="instagram">인스타 ID</option>
          <option value="kakao">카카오톡 ID</option>
          <option value="phone">전화번호</option>
          <option value="etc">기타</option>
        </select>

        <input
          type="text"
          name="contactValue"
          placeholder={getContactPlaceholder()}
          value={profile.contactValue}
          onChange={onProfileChange}
          className="contact-value-input"
        />
      </div>
    </div>

   
  </section>

  <button
    type="submit"
    className="profile-submit-button"
    disabled={isSubmittingProfile}
  >
    {isSubmittingProfile
      ? '저장 중...'
      : profileFormMode === 'edit'
        ? '수정 내용 저장하기'
        : '프로필 저장하기'}
  </button>
</form>
  );
}

export default ProfileForm;