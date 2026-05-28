function BottomNav({
  currentPage,
  setCurrentPage,
  receivedCount,
  matchCount,
}) {
  
  
  
  return (
    <nav className="bottom-nav">
      <button
        className={currentPage === 'browse' ? 'active-nav' : ''}
        onClick={() => setCurrentPage('browse')}
      >
        둘러보기
      </button>

      <button
        className={currentPage === 'received' ? 'active-nav' : ''}
        onClick={() => setCurrentPage('received')}
      >
        받은 관심
        {receivedCount > 0 && <span className="nav-count">{receivedCount}</span>}
      </button>

      <button
        className={currentPage === 'matches' ? 'active-nav' : ''}
        onClick={() => setCurrentPage('matches')}
      >
        매칭
        {matchCount > 0 && <span className="nav-count">{matchCount}</span>}
      </button>

      <button
        className={currentPage === 'profileComplete' ? 'active-nav' : ''}
        onClick={() => setCurrentPage('profileComplete')}
      >
        내 프로필
      </button>
    </nav>
  );
}

export default BottomNav;