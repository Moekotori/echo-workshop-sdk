// Generated from contracts/providers.json.
/// <reference path="./echo-workshop-provider-models.d.ts" />
interface EchoWorkshopLyricsWorkflows {
  providers: {
    onChanged(handler: (change: null) => unknown): EchoWorkshopUnsubscribe;
    list(): Promise<EchoWorkshopProviderDescriptor[]>;
  };
  candidates: {
    onChanged(handler: (change: null) => unknown): EchoWorkshopUnsubscribe;
    get(trackId: string): Promise<EchoWorkshopCandidate[]>;
    search(trackId: string, options: EchoWorkshopCandidateSearch): Promise<EchoWorkshopCandidate[]>;
    preview(trackId: string, candidateId: string): Promise<EchoWorkshopCandidatePreview>;
    apply(trackId: string, candidateId: string): Promise<unknown>;
    reject(trackId: string, candidateId: string): Promise<unknown>;
    cancel(requestId: string): Promise<boolean>;
  };
}
interface EchoWorkshopMetadataWorkflows {
  providers: {
    onChanged(handler: (change: null) => unknown): EchoWorkshopUnsubscribe;
    list(): Promise<EchoWorkshopProviderDescriptor[]>;
  };
  candidates: {
    onChanged(handler: (change: null) => unknown): EchoWorkshopUnsubscribe;
    get(trackId: string): Promise<EchoWorkshopCandidate[]>;
    search(trackId: string, options: EchoWorkshopCandidateSearch): Promise<EchoWorkshopCandidate[]>;
    preview(trackId: string, candidateId: string): Promise<EchoWorkshopCandidatePreview>;
    apply(trackId: string, candidateId: string): Promise<unknown>;
    reject(trackId: string, candidateId: string): Promise<unknown>;
    cancel(requestId: string): Promise<boolean>;
  };
}
interface EchoWorkshopCoversWorkflows {
  providers: {
    onChanged(handler: (change: null) => unknown): EchoWorkshopUnsubscribe;
    list(): Promise<EchoWorkshopProviderDescriptor[]>;
  };
  candidates: {
    onChanged(handler: (change: null) => unknown): EchoWorkshopUnsubscribe;
    get(trackId: string): Promise<EchoWorkshopCandidate[]>;
    search(trackId: string, options: EchoWorkshopCandidateSearch): Promise<EchoWorkshopCandidate[]>;
    preview(trackId: string, candidateId: string): Promise<EchoWorkshopCandidatePreview>;
    apply(trackId: string, candidateId: string): Promise<unknown>;
    reject(trackId: string, candidateId: string): Promise<unknown>;
    cancel(requestId: string): Promise<boolean>;
  };
}
