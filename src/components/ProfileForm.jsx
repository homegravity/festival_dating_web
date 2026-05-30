function ProfileForm({
  profile,
  profileFormMode,
  isSubmittingProfile,
  onProfileChange,
  onProfileSubmit,
}) {
  
  return (
    <form className="card" onSubmit={onProfileSubmit}>
      <div className="notice-box">
        <p>연락수단은 매칭된 상대에게만 공개돼요.</p>
        <p>관심을 보내고 상대방이 수락하면 매칭됩니다.</p>
      </div>

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

      <label className="field-label">
        <span>학년</span>
        <span className="field-badge required">필수</span>
      </label>
      <select
        name="grade"
        value={profile.grade}
        onChange={onProfileChange}
      >
        <option value="">선택해주세요</option>
        <option value="1학년">1학년</option>
        <option value="2학년">2학년</option>
        <option value="3학년">3학년</option>
        <option value="4학년">4학년</option>
        <option value="졸업생">졸업생</option>
      </select>



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

        <label className="field-label">
          <span>MBTI</span>
          <span className="field-badge optional">선택</span>
        </label>
      <input
        type="text"
        name="mbti"
        placeholder="선택 입력 예: ENFP"
        value={profile.mbti}
        onChange={onProfileChange}
      />

      <label className="field-label">
        <span>관심사</span>
        <span className="field-badge required">필수</span>
      </label>
      <input
        type="text"
        name="interests"
        placeholder="예: 노래, 영화, 산책"
        value={profile.interests}
        onChange={onProfileChange}
      />

      <label className="field-label">
        <span>자기소개</span>
        <span className="field-badge required">필수</span>
      </label>
      <textarea
        name="introduction"
        placeholder="간단하게 자신을 소개해주세요."
        value={profile.introduction}
        onChange={onProfileChange}
      />

      <label className="field-label">
        <span>이상형</span>
        <span className="field-badge optional">선택</span>
      </label>
      <textarea
        name="idealType"
        placeholder="선택 입력"
        value={profile.idealType}
        onChange={onProfileChange}
      />

      <label className="field-label">
        <span>연락수단 종류</span>
        <span className="field-badge required">필수</span>
      </label>

      <select
        name="contactType"
        value={profile.contactType}
        onChange={onProfileChange}
      >
        <option value="instagram">인스타 ID</option>
        <option value="kakao">카카오톡 ID</option>
        <option value="phone">전화번호</option>
        <option value="etc">기타</option>
      </select>

      <label className="field-label">
        <span>연락수단</span>
        <span className="field-badge required">필수</span>
      </label>
      
      
      <input
        type="text"
        name="contactValue"
        placeholder="예: @mango_2026"
        value={profile.contactValue}
        onChange={onProfileChange}
      />

        <button type="submit" disabled={isSubmittingProfile}>
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