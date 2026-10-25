import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './NavBlurDebugPanel.css';


function readBackdropFilter(style) {
  if (!style) {
    return '요소 없음';
  }

  return (
    style.getPropertyValue('backdrop-filter').trim() ||
    style.getPropertyValue('-webkit-backdrop-filter').trim() ||
    'none'
  );
}


function collectNavBlurDiagnostics() {
  const navElement = document.querySelector('.bottom-nav');
  const appElement = navElement?.closest('.app') || document.querySelector('.app');
  const independentBlurElement = document.querySelector(
    '.nav-blur-debug-independent-blur'
  );
  const navStyle = navElement ? window.getComputedStyle(navElement) : null;
  const navBeforeStyle = navElement
    ? window.getComputedStyle(navElement, '::before')
    : null;
  const appStyle = appElement ? window.getComputedStyle(appElement) : null;
  const independentBlurStyle = independentBlurElement
    ? window.getComputedStyle(independentBlurElement)
    : null;

  return {
    supportsStandard: window.CSS?.supports('backdrop-filter', 'blur(1px)') ?? false,
    supportsWebkit:
      window.CSS?.supports('-webkit-backdrop-filter', 'blur(1px)') ?? false,
    navBackdropFilter: readBackdropFilter(navStyle),
    navBeforeBackdropFilter: readBackdropFilter(navBeforeStyle),
    independentBackdropFilter: readBackdropFilter(independentBlurStyle),
    navBackground: navStyle
      ? `${navStyle.backgroundColor} / ${navStyle.backgroundImage}`
      : '요소 없음',
    navBeforeBackground: navBeforeStyle
      ? `${navBeforeStyle.backgroundColor} / ${navBeforeStyle.backgroundImage}`
      : '요소 없음',
    navTransform: navStyle?.transform || '요소 없음',
    appOverflow: appStyle
      ? `${appStyle.overflowX} / ${appStyle.overflowY}`
      : '요소 없음',
    userAgent: window.navigator.userAgent,
  };
}


function NavBlurDebugPanel() {
  const isEnabled =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debugNavBlur') === '1';
  const [diagnostics, setDiagnostics] = useState(null);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const updateDiagnostics = () => {
      setDiagnostics(collectNavBlurDiagnostics());
    };
    const animationFrame = window.requestAnimationFrame(updateDiagnostics);

    window.addEventListener('resize', updateDiagnostics);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateDiagnostics);
    };
  }, [isEnabled]);

  if (!isEnabled || typeof document === 'undefined') {
    return null;
  }

  const diagnosticRows = diagnostics
    ? [
        ['표준 지원', String(diagnostics.supportsStandard)],
        ['WebKit 지원', String(diagnostics.supportsWebkit)],
        ['A nav filter', diagnostics.navBackdropFilter],
        ['A nav::before filter', diagnostics.navBeforeBackdropFilter],
        ['B 독립 filter', diagnostics.independentBackdropFilter],
        ['A nav background', diagnostics.navBackground],
        ['A nav::before background', diagnostics.navBeforeBackground],
        ['A nav transform', diagnostics.navTransform],
        ['.app overflow-x / y', diagnostics.appOverflow],
        ['User-Agent', diagnostics.userAgent],
      ]
    : [];

  return createPortal(
    <>
      <div className="nav-blur-debug-current-backdrop" aria-hidden="true" />

      <aside className="nav-blur-debug-panel" aria-label="하단 네비게이션 블러 진단">
        <div className="nav-blur-debug-heading">
          <div>
            <p>임시 진단 모드</p>
            <h2>하단 네비게이션 블러 비교</h2>
          </div>
          <span>?debugNavBlur=1</span>
        </div>

        <section className="nav-blur-debug-section">
          <h3>A. 현재 하단 네비게이션</h3>
          <p>
            화면 맨 아래 체크 패턴이 실제 네비게이션 뒤에서 흐려지는지 확인하세요.
          </p>
        </section>

        <section className="nav-blur-debug-section">
          <h3>B. body 직속 독립 테스트</h3>
          <div className="nav-blur-debug-independent-pattern" aria-label="독립 블러 테스트 영역">
            <span className="nav-blur-debug-pattern-label">선명한 패턴</span>
            <div className="nav-blur-debug-independent-blur">
              <span>blur(22px)</span>
            </div>
          </div>
        </section>

        <section className="nav-blur-debug-section">
          <h3>적용 정보</h3>
          {diagnostics ? (
            <dl className="nav-blur-debug-values">
              {diagnosticRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>computed style을 확인하는 중입니다.</p>
          )}
        </section>

        <p className="nav-blur-debug-guide">
          B만 흐리면 기존 nav의 합성·컨텍스트 문제, A와 B가 모두 흐리면 실제 서비스
          배경의 대비 문제일 가능성이 큽니다. 둘 다 선명하면 현재 Chrome/WebView의
          렌더링 상태를 추가 확인해야 합니다.
        </p>
      </aside>
    </>,
    document.body
  );
}


export default NavBlurDebugPanel;
