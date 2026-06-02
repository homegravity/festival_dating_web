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
}) {
  
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
      otherProfile.department,
      otherProfile.mbti,
    ].filter(Boolean);




  
  return (
    <div className="profile-card">
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

      {(otherProfile.faceType || hasEgenTetoScore) && (
        <div className="profile-feature-row">
          {otherProfile.faceType && (
            <span className="profile-feature-chip">
              {otherProfile.faceType}
            </span>
          )}

          {hasEgenTetoScore && (
            <span className="profile-feature-chip">
              {getEgenTetoText()}
            </span>
          )}
        </div>
      )}
      
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





      {mode === 'browse' && (
        <button
          className={isLiked ? 'cancel-button' : ''}
          onClick={() => onToggleLike(otherProfile.id)}
          disabled={isProcessing}
        >
          {isProcessing
            ? '처리 중...'
            : isLiked
              ? '관심 취소'
              : '관심 보내기'}
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
                <p>{otherProfile.contactValue}</p>
              </>
            ) : (
              <p>연락수단을 불러오는 중이에요.</p>
            )}
          </div>
        )}
    </div>
  );
}

export default ProfileCard;