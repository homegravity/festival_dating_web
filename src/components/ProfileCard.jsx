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
  
  
  
  const hasEgenTetoScore =
    otherProfile.egenTetoScore !== '' &&
    otherProfile.egenTetoScore !== null &&
    otherProfile.egenTetoScore !== undefined &&
    !Number.isNaN(Number(otherProfile.egenTetoScore));
  
  
  
  
  return (
    <div className="profile-card">
      <h2>{otherProfile.nickname}</h2>

      <p className="basic-info">
        {otherProfile.gender}
        {otherProfile.grade && ` · ${otherProfile.grade}`}
        {otherProfile.age && ` · ${otherProfile.age}세`}
        {otherProfile.department && ` · ${otherProfile.department}`}
        {otherProfile.mbti && ` · ${otherProfile.mbti}`}
      </p>

      
      {otherProfile.egenTetoScore !== '' &&
        otherProfile.egenTetoScore !== null &&
        otherProfile.egenTetoScore !== undefined && (
          <p>
            <strong>에겐-테토:</strong>{' '}
            에겐 {100 - Number(otherProfile.egenTetoScore)}% · 테토 {Number(otherProfile.egenTetoScore)}%
          </p>
        )}
      
      <p><strong>관심사:</strong> {otherProfile.interests}</p>
      <p><strong>한줄 소개:</strong> {otherProfile.introduction}</p>

      {otherProfile.idealType && (
        <p><strong>이상형:</strong> {otherProfile.idealType}</p>
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