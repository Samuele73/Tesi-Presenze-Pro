type ApiOp = 'DELETE' | 'UPDATE' | 'GET' | 'ADD';
export type ApiError = {
  error: string;
  op: ApiOp;
};
