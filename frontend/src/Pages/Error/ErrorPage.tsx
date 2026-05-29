import React from "react";
import { useNavigate } from "react-router-dom";

interface ErrorPageProps {
  statusCode: number | string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  buttonAction?: () => void;
}

export default function ErrorPage({
  statusCode,
  icon,
  title,
  description,
  buttonText = "메인화면으로 돌아가기",
  buttonAction,
}: ErrorPageProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (buttonAction) {
      buttonAction();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h1 className="text-5xl font-bold text-gray-800 mb-2">
        {statusCode} - {title}
      </h1>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg shadow transition"
      >
        {buttonText}
      </button>
    </div>
  );
}
