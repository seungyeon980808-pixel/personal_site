import { GrainGradient } from '@paper-design/shaders-react'
import './App.css'

function App() {
  return (
    <div className="page">
      <GrainGradient
        className="bg"
        colors={['#0969da', '#0e7490', '#3b82f6', '#08090c']}
        colorBack="#08090c"
        shape="corners"
        softness={1}
        intensity={0.6}
        noise={0.6}
        rotation={40}
        speed={0.4}
      />

      <nav>
        <div className="logo">박승연</div>
        <div className="navlinks">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <header>
        <div className="eyebrow"><span className="dot" /> 서울 대왕중학교 과학교사</div>
        <h1>도구를 만들고,<br />직접 <span className="grad">배포합니다.</span></h1>
        <p className="lead">
          아이디어를 실제로 쓸 수 있는 형태로 옮기는 일을 합니다.
          수업과 행정을 위한 웹 도구, 자동화, 그리고 작은 실험들.
        </p>
        <div className="cta">
          <a className="btn btn-primary" href="#work">프로젝트 보기</a>
          <a className="btn btn-ghost" href="#contact">연락하기</a>
        </div>
      </header>

      <section className="cards" id="work">
        <div className="section-title">SELECTED WORK</div>
        <div className="grid3">
          <div className="card"><div className="card-icon">◆</div><h3>5E</h3><p>과학 수업 설계와 자료 제작을 위한 도구.</p></div>
          <div className="card"><div className="card-icon">◇</div><h3>edunote</h3><p>수업 기록과 행정 업무를 정리하는 노트 허브.</p></div>
          <div className="card"><div className="card-icon">◈</div><h3>K-마이파인</h3><p>실용 도구.</p></div>
        </div>
      </section>

      <footer id="contact">© 2026 박승연 — Built with intent.</footer>
    </div>
  )
}

export default App
