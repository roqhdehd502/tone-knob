import { Link } from "react-router";

export function meta() {
  return [
    { title: "개인정보처리방침 - Tone Knob" },
    { name: "description", content: "Tone Knob 개인정보처리방침" },
  ];
}

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-miami-600 hover:underline dark:text-miami-400"
      >
        ← 홈으로 돌아가기
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">개인정보처리방침</h1>
      <p className="mb-10 text-sm text-gray-500 dark:text-gray-400">시행일: 2026년 3월 19일</p>

      <div className="prose prose-gray max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mt-10 prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed">
        <p>
          톤 노브(Tone Knob, 이하 "회사")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를
          보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이
          개인정보 처리방침을 수립·공개합니다.
        </p>

        <h2>제1조 (개인정보의 처리 목적)</h2>
        <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
        <ol>
          <li>
            <strong>회원가입 및 관리:</strong> 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인
            식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지
          </li>
          <li>
            <strong>서비스 제공:</strong> 타브 제작, 실시간 합주, 커뮤니티, 마켓플레이스 등 서비스
            제공, Knob 재화 관리
          </li>
          <li>
            <strong>고충처리:</strong> 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지,
            처리결과 통보
          </li>
        </ol>

        <h2>제2조 (수집하는 개인정보의 항목)</h2>
        <ol>
          <li>
            <strong>필수 항목:</strong> 이메일 주소, 사용자 이름(닉네임), 비밀번호(소셜 로그인 제외)
          </li>
          <li>
            <strong>소셜 로그인 시:</strong> 소셜 서비스 제공자의 고유 식별자, 이메일, 프로필 사진
            URL
          </li>
          <li>
            <strong>자동 수집 항목:</strong> IP 주소, 쿠키, 접속 로그, 서비스 이용 기록
          </li>
        </ol>

        <h2>제3조 (개인정보의 처리 및 보유 기간)</h2>
        <ol>
          <li>
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
            동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </li>
          <li>
            <strong>회원 정보:</strong> 회원 탈퇴 시까지 (탈퇴 후 즉시 파기)
          </li>
          <li>
            <strong>서비스 이용 기록:</strong> 3년 (통신비밀보호법)
          </li>
          <li>
            <strong>결제 관련 기록:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)
          </li>
        </ol>

        <h2>제4조 (개인정보의 제3자 제공)</h2>
        <p>
          회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 정보주체의 동의,
          법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를
          제3자에게 제공합니다.
        </p>

        <h2>제5조 (개인정보의 파기)</h2>
        <ol>
          <li>
            회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
            지체 없이 해당 개인정보를 파기합니다.
          </li>
          <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
        </ol>

        <h2>제6조 (정보주체의 권리·의무 및 행사방법)</h2>
        <ol>
          <li>
            정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수
            있습니다.
            <ul>
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
          </li>
          <li>
            권리 행사는 서비스 설정 페이지 또는 이메일(mwna9409@gmail.com)을 통하여 하실 수
            있습니다.
          </li>
        </ol>

        <h2>제7조 (개인정보의 안전성 확보 조치)</h2>
        <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
        <ul>
          <li>비밀번호의 암호화 저장 (bcrypt)</li>
          <li>접속 기록의 보관 및 위·변조 방지</li>
          <li>개인정보에 대한 접근 제한 (JWT 기반 인증)</li>
          <li>HTTPS 통신 암호화</li>
        </ul>

        <h2>제8조 (개인정보 보호책임자)</h2>
        <ul>
          <li>
            <strong>성명:</strong> 나민우
          </li>
          <li>
            <strong>직책:</strong> 대표
          </li>
          <li>
            <strong>이메일:</strong> mwna9409@gmail.com
          </li>
        </ul>

        <h2>제9조 (개인정보 처리방침 변경)</h2>
        <p>
          이 개인정보처리방침은 2026년 3월 19일부터 적용됩니다. 변경사항이 있을 경우 서비스 내
          공지사항을 통하여 고지할 것입니다.
        </p>

        <h2>제10조 (권익침해 구제방법)</h2>
        <p>
          정보주체는 개인정보침해로 인한 구제를 받기 위하여 다음 기관에 분쟁해결이나 상담 등을
          신청할 수 있습니다.
        </p>
        <ul>
          <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
          <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
          <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
          <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
        </ul>
      </div>
    </div>
  );
}
