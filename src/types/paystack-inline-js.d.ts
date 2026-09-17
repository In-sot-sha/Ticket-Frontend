declare module '@paystack/inline-js' {
  export type PaystackSuccessResponse = {
    reference?: string;
    id?: number;
    message?: string;
  };

  export type PaystackCallbacks = {
    onSuccess?: (transaction: PaystackSuccessResponse) => void;
    onCancel?: () => void;
    onLoad?: (payload: unknown) => void;
    onError?: (error: { message?: string }) => void;
  };

  export default class PaystackPop {
    newTransaction(
      options: PaystackCallbacks & {
        key?: string;
        email?: string;
        amount?: number;
        currency?: string;
        ref?: string;
        accessCode?: string;
      }
    ): unknown;
    resumeTransaction(accessCode: string, callbacks?: PaystackCallbacks): unknown;
    cancelTransaction(id?: string): void;
  }
}
