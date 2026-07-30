import LottieLoader from '@/components/LottieLoader';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface-container-lowest/50">
      <LottieLoader size={200} />
    </div>
  );
}
