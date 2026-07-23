// Standalone entry: mounts GrainGradient shaders into any plain HTML page.
// Built with `npm run build:bg` → a single self-contained JS file (React bundled in).
//
// 마운트 대상은 [data-shader] 를 가진 모든 요소다. 여러 개를 겹쳐 두면
// 서로 다른 shape 을 레이어로 쌓을 수 있다 (예: corners 위에 blob).
// 설정은 전부 data-* 속성으로 읽으므로 재빌드 없이 HTML 에서 조절한다.
import { createRoot } from 'react-dom/client'
import { GrainGradient } from '@paper-design/shaders-react'

const roots = new WeakMap()

function num(v, fallback) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : fallback
}

function renderHost(host) {
  const d = host.dataset
  if (!roots.has(host)) roots.set(host, createRoot(host))
  roots.get(host).render(
    <GrainGradient
      style={{ width: '100%', height: '100%' }}
      colors={(d.colors || '#0969da,#0e7490,#3b82f6,#08090c').split(',')}
      colorBack={d.colorBack || '#08090c'}
      // wave | dots | truchet | corners | ripple | blob | sphere
      shape={d.shape || 'corners'}
      softness={num(d.softness, 1)}
      intensity={num(d.intensity, 0.6)}
      noise={num(d.noise, 0.6)}
      rotation={num(d.rotation, 40)}
      speed={num(d.speed, 0.4)}
      // 성능: 라이브러리 기본값은 2배 해상도(minPixelRatio 2)라 FHD 에서
      // 프레임마다 800만 픽셀을 그린다. 1배 + 총 픽셀 상한으로 묶는다.
      // 그레인 특성상 업스케일돼도 거칠어진 티가 거의 안 난다.
      minPixelRatio={num(d.minPixelRatio, 1)}
      maxPixelCount={num(d.maxPixels, 1400000)}
    />
  )
}

function mountAll() {
  const hosts = document.querySelectorAll('[data-shader], #shaderBg')
  hosts.forEach(renderHost)
}

// data-* 를 바꾼 뒤 호출하면 그 자리에서 다시 그린다 (언마운트 없이 재렌더)
window.__shader = { refresh: mountAll, render: renderHost }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAll)
} else {
  mountAll()
}
