import { useState } from 'react';


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

  return '기타 연락수단';
};




function ProfileCard({
  otherProfile,
  mode,
  isLiked,
  isProcessing,
  processingAction,
  onToggleLike,
  onAcceptLike,
  onRejectLike,
  handleCopyContactValue,
  onHideMatch,
}) {
  
  const [isMatchDetailOpen, setIsMatchDetailOpen] = useState(false);



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
  
  const profileInterestList = otherProfile.interests
    ? otherProfile.interests.split(',').map((item) => item.trim()).filter(Boolean)
    : [];
  
  const hasEgenTetoScore =
    otherProfile.egenTetoScore !== '' &&
    otherProfile.egenTetoScore !== null &&
    otherProfile.egenTetoScore !== undefined &&
    !Number.isNaN(Number(otherProfile.egenTetoScore));
  
    const profileFaceTypeList = otherProfile.faceType
  ? otherProfile.faceType.split(',').map((item) => item.trim()).filter(Boolean)
  : [];



    const getEgenTetoText = () => {
      if (!hasEgenTetoScore) {
        return '';
      }
    
      const tetoScore = Number(otherProfile.egenTetoScore);
      const egenScore = 100 - tetoScore;
    
      return `에겐 ${egenScore}% · 테토 ${tetoScore}%`;
    };



    const profileMetaItems = [
      otherProfile.gender,
      otherProfile.grade,
      otherProfile.age ? `${otherProfile.age}세` : '',
      otherProfile.department ? `🎓 ${otherProfile.department}` : '',
      otherProfile.mbti,
    ].filter(Boolean);




  
  return (
    
      <div className={`profile-card ${mode === 'browse' ? 'browse-profile-card' : ''}`}>
        {mode === 'match' && onHideMatch && (
          <button
            type="button"
            className="match-hide-button"
            onClick={(event) => {
              event.stopPropagation();
              event.currentTarget.blur();
              onHideMatch(otherProfile.id);
            }}
            aria-label="매칭 프로필 숨기기"
          >
            ×
          </button>
        )}
                






        <div className="profile-card-top">
            <div className="profile-card-header">
        <div>
          <h2>{otherProfile.nickname}</h2>

          {profileMetaItems.length > 0 && (
            <p className="profile-meta">
              {profileMetaItems.join(' · ')}
            </p>
          )}
        </div>
      </div>

      {(profileFaceTypeList.length > 0 || hasEgenTetoScore) && (
        <div className="profile-feature-row">
          {profileFaceTypeList.map((faceType) => (
            <span key={faceType} className="profile-feature-chip">
              {faceType}
            </span>
          ))}

          {hasEgenTetoScore && (
            <span className="profile-feature-chip egen-teto-chip">
              <span className="egen-teto-label">에겐</span>
              <span className="egen-teto-percent">
                {100 - Number(otherProfile.egenTetoScore)}%
              </span>

              <span className="egen-teto-divider">·</span>

              <span className="egen-teto-label">테토</span>
              <span className="egen-teto-percent">
                {Number(otherProfile.egenTetoScore)}%
              </span>
            </span>
          )}
        </div>
      )}
      </div>
      
      
            <div
        className={`match-detail-panel ${
          mode === 'match' && !isMatchDetailOpen ? 'closed' : 'open'
        }`}
      >
        <div className={`profile-card-scroll ${mode === 'match' ? 'match-detail-content' : ''}`}>
          <div className="profile-section">
            <p className="profile-section-title">관심사</p>

            <div className="profile-interest-list">
              {profileInterestList.map((interest) => (
                <span key={interest} className="profile-interest-chip">
                  {interestEmojiMap[interest] && (
                    <span className="interest-emoji">{interestEmojiMap[interest]}</span>
                  )}
                  <span>{interest}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="profile-section">
            <p className="profile-section-title">한줄 소개</p>
            <p className="profile-section-text">{otherProfile.introduction}</p>
          </div>

          {otherProfile.idealType && (
            <div className="profile-section">
              <p className="profile-section-title">이상형</p>
              <p className="profile-section-text">{otherProfile.idealType}</p>
            </div>
          )}
        </div>
      </div>

      {mode === 'match' && (
        <button
          type="button"
          className={`match-detail-toggle ${isMatchDetailOpen ? 'open' : ''}`}
          onClick={(event) => {
            event.currentTarget.blur();
            setIsMatchDetailOpen((prev) => !prev);
          }}
          aria-label={isMatchDetailOpen ? '프로필 상세정보 접기' : '프로필 상세정보 펼치기'}
        >
          <span className="match-detail-toggle-icon" />
        </button>
      )}


      <div className="profile-card-actions">
      {mode === 'browse' && (
              <button
                type="button"
                className={`like-action-button ${isLiked ? 'liked' : ''}`}
                onClick={() => onToggleLike(otherProfile.id)}
                disabled={isProcessing}
              >
                <span className="like-action-icon">
                  {isLiked ? '↺' : '♡'}
                </span>

                <span>
                  {isProcessing
                    ? '처리 중...'
                    : isLiked
                      ? '관심 취소'
                      : '관심 보내기'}
                </span>
              </button>
            )}


        {mode === 'received' && (
          <div className="button-row">
            <button
              onClick={() => onAcceptLike(otherProfile.id)}
              disabled={isProcessing}
            >
              {isProcessing && processingAction === 'accept'
                ? '수락 중...'
                : '수락하기'}
            </button>

            <button
              className="cancel-button"
              onClick={() => onRejectLike(otherProfile.id)}
              disabled={isProcessing}
            >
              {isProcessing && processingAction === 'reject'
                ? '거절 중...'
                : '거절하기'}
            </button>
          </div>
        )}

{mode === 'match' && (
  <div className="contact-box">
    {otherProfile.contactValue ? (
      <>
        <p>
          <strong>연락수단:</strong> {getContactTypeLabel(otherProfile.contactType)}
        </p>

        <p className="contact-copy-row">
          <span>{otherProfile.contactValue}</span>

          <button
            type="button"
            className="contact-copy-icon-button"
            onClick={() => handleCopyContactValue(otherProfile.contactValue)}
            aria-label="연락수단 복사"
          >
            📋 복사
          </button>
        </p>
      </>
    ) : (
      <p>연락수단을 불러오는 중이에요.</p>
    )}
  </div>
)}
      </div>
          </div>
  );
}

export default ProfileCard;