export type Ok<TSuccess> = {
  kind: 'ok';
  value: TSuccess;
};

export type Err<TFailure> = {
  kind: 'err';
  error: TFailure;
};

export type Result<TSuccess, TFailure> = Ok<TSuccess> | Err<TFailure>;

export const ok = <TSuccess>(value: TSuccess): Ok<TSuccess> => ({
  kind: 'ok',
  value,
});

export const err = <TFailure>(error: TFailure): Err<TFailure> => ({
  kind: 'err',
  error,
});

export const isOk = <TSuccess, TFailure>(
  result: Result<TSuccess, TFailure>,
): result is Ok<TSuccess> => result.kind === 'ok';

export const map = <TSuccess, TFailure, TNextSuccess>(
  result: Result<TSuccess, TFailure>,
  mapper: (value: TSuccess) => TNextSuccess,
): Result<TNextSuccess, TFailure> => {
  if (result.kind === 'err') {
    return result;
  }

  return ok(mapper(result.value));
};

export const flatMap = <TSuccess, TFailure, TNextSuccess, TNextFailure>(
  result: Result<TSuccess, TFailure>,
  mapper: (value: TSuccess) => Result<TNextSuccess, TNextFailure>,
): Result<TNextSuccess, TFailure | TNextFailure> => {
  if (result.kind === 'err') {
    return result;
  }

  return mapper(result.value);
};

export const mapAsync = async <TSuccess, TFailure, TNextSuccess>(
  resultPromise: Promise<Result<TSuccess, TFailure>>,
  mapper: (value: TSuccess) => Promise<TNextSuccess>,
): Promise<Result<TNextSuccess, TFailure>> => {
  const result = await resultPromise;
  if (result.kind === 'err') {
    return result;
  }

  return ok(await mapper(result.value));
};

export const flatMapAsync = async <
  TSuccess,
  TFailure,
  TNextSuccess,
  TNextFailure,
>(
  resultPromise: Promise<Result<TSuccess, TFailure>>,
  mapper: (
    value: TSuccess,
  ) => Promise<Result<TNextSuccess, TNextFailure>>,
): Promise<Result<TNextSuccess, TFailure | TNextFailure>> => {
  const result = await resultPromise;
  if (result.kind === 'err') {
    return result;
  }

  return mapper(result.value);
};
