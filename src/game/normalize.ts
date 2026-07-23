export function normalizeVietnameseAnswer(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLocaleLowerCase("vi")
    .replace(/[^a-z0-9]/g, "");
}

export function getAcceptedNormalizedAnswers(answers: readonly string[]) {
  return [...new Set(answers.map(normalizeVietnameseAnswer).filter(Boolean))];
}
