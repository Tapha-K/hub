import { expect, test } from 'vitest';

import {
  BOOK_PAGE_COLOR,
  getBookScale,
  getBookshelfCameraFov,
  getTurningPageMotion,
} from './ThreeBookshelf';

test('데스크톱에서 서가 카메라를 움직이지 않고 펼친 책 전체를 보여준다', () => {
  const cameraFov = getBookshelfCameraFov(1024);
  const zoomScale = getBookScale(1024, 'zooming');
  const cameraDistance = 9.8 - 3.65;
  const openingApparentHeight = (3.08 * getBookScale(1024, 'opening')) / (9.8 - 3.05);
  const zoomApparentHeight = (3.08 * zoomScale) / cameraDistance;
  const visibleHalfHeight = Math.tan((cameraFov * Math.PI) / 360) * cameraDistance;
  const bookTopFromCamera = -1.31 + 3.08 * zoomScale - 0.3;

  expect(visibleHalfHeight).toBeGreaterThan(bookTopFromCamera);
  expect(zoomApparentHeight).toBeGreaterThan(openingApparentHeight);
  expect(cameraFov).toBe(34);
  expect(getBookScale(390, 'zooming')).toBe(1.42);
  expect(getBookshelfCameraFov(390)).toBe(54);
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
