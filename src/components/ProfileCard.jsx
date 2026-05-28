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
  onToggleLike,
  onAcceptLike,
  onRejectLike,
}) {
  return (
    <div className="profile-card">
      <h2>{otherProfile.nickname}</h2>

      <p className="basic-info">
        {otherProfile.gender} · {otherProfile.grade}
        {otherProfile.department && ` · ${otherProfile.department}`}
        {otherProfile.mbti && ` · ${otherProfile.mbti}`}
      </p>

      <p><strong>관심사:</strong> {otherProfile.interests}</p>
      <p><strong>자기소개:</strong> {otherProfile.introduction}</p>

      {otherProfile.idealType && (
        <p><strong>이상형:</strong> {otherProfile.idealType}</p>
      )}

      {mode === 'browse' && (
        <button
          className={isLiked ? 'cancel-button' : ''}
          onClick={() => onToggleLike(otherProfile.id)}
        >
          {isLiked ? '관심 취소' : '관심 보내기'}
        </button>
      )}

      {mode === 'received' && (
        <div className="button-row">
          <button onClick={() => onAcceptLike(otherProfile.id)}>
            수락하기
          </button>

          <button
            className="cancel-button"
            onClick={() => onRejectLike(otherProfile.id)}
          >
            거절하기
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