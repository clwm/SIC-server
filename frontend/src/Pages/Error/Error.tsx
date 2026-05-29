import ErrorPage from "./ErrorPage";

export function ForbiddenPage() {
  return (
    <ErrorPage
      statusCode="403"
      icon="🚫"
      title="접근 거부"
      description="이 페이지에 접근할 수 있는 권한이 없습니다."
    />
  );
}

export function NotFoundPage() {
  return (
    <ErrorPage
      statusCode="404"
      icon="❓"
      title="페이지를 찾을 수 없습니다"
      description="요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다."
    />
  );
}

export function TooManyRequestsPage() {
  return (
    <ErrorPage
      statusCode="429"
      icon="🚫"
      title="너무 많은 요청"
      description="잠시 후 다시 시도해주세요. 너무 빠른 요청이 감지되었습니다."
    />
  );
}

export function InternalServerErrorPage() {
  return (
    <ErrorPage
      statusCode="500"
      icon="💥"
      title="서버 내부 오류"
      description="서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
    />
  );
}