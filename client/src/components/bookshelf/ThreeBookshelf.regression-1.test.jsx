import { expect, test } from 'vitest';

import {
  BOOK_PAGE_COLOR,
  getBookshelfCameraFov,
  getTurningPageMotion,
} from './ThreeBookshelf';

test('데스크톱에서 책을 펼칠 때 확대된 책 전체가 카메라 안에 들어온다', () => {
  const cameraFov = getBookshelfCameraFov(1024, true);
  const cameraDistance = 9.8 - 3.65;
  const visibleHalfHeight = Math.tan((cameraFov * Math.PI) / 360) * cameraDistance;
  const bookTopFromCamera = -1.31 + 3.08 * 1.42 - 0.3;

  expect(visibleHalfHeight).toBeGreaterThan(bookTopFromCamera);
  expect(getBookshelfCameraFov(1024, false)).toBe(34);
  expect(getBookshelfCameraFov(390, false)).toBe(54);
});

test('상세 화면으로 확대할 때 마지막 페이지를 완전히 펼친 상태로 고정한다', () => {
  const motion = getTurningPageMotion({
    shouldTurn: true,
    isZooming: true,
    turnedLayer: 0.32,
    unturnedLayer: 0.34,
  });

  expect(motion).toMatchObject({
    rotation: -Math.PI,
    layer: 0.32,
    immediate: true,
  });
});

test('3D 책 내부 페이지는 앱 배경과 구분되는 흰색을 사용한다', () => {
  expect(BOOK_PAGE_COLOR).toBe('#ffffff');
});
