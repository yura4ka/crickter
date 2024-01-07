import { forwardRef } from "react";
import { UploadCtxProvider } from "@uploadcare/blocks";

interface Props {
  ctxName: string;
  ucareToken: string | undefined;
  expire: number | undefined;
}

const Uploader = forwardRef<UploadCtxProvider, Props>(
  ({ ctxName, ucareToken, expire }, ref) => {
    return (
      <div className="w-0">
        <lr-config
          ctx-name={ctxName}
          pubkey="2ac4018b8e52c68924ae"
          secureSignature={ucareToken}
          secureExpire={expire?.toString()}
          maxLocalFileSizeBytes={5000000}
          imgOnly={true}
          sourceList="local, url, camera"
          use-cloud-image-editor="true"
          multipleMax={6}
        ></lr-config>
        <lr-headless-modal
          ctx-name={ctxName}
          css-src="https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-file-uploader-regular.min.css"
          class="uploadcare-config"
        ></lr-headless-modal>
        <lr-upload-ctx-provider ctx-name={ctxName} ref={ref}></lr-upload-ctx-provider>
        <lr-data-output ctx-name={ctxName} use-event></lr-data-output>
      </div>
    );
  }
);

export { Uploader };
