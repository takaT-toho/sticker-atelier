# Google Cloud Runへのデプロイ手順

このドキュメントでは、このReactアプリケーションをGoogle Cloud Runにデプロイする手順を説明します。

## 1. 前提条件

デプロイを始める前に、以下のツールがインストールされ、設定されていることを確認してください。

*   **Google Cloud SDK (gcloud CLI):** [インストールガイド](https://cloud.google.com/sdk/docs/install)
*   **Docker:** [インストールガイド](https://docs.docker.com/get-docker/)

### Google Cloudの設定

1.  **gcloud CLIの認証:**
    ```bash
    gcloud auth login
    ```

2.  **プロジェクトの設定:**
    ```bash
    gcloud config set project [YOUR_PROJECT_ID]
    ```
    `[YOUR_PROJECT_ID]` は実際のGoogle CloudプロジェクトIDに置き換えてください。

3.  **リージョンの設定:**
    ```bash
    gcloud config set run/region [YOUR_REGION]
    ```
    `[YOUR_REGION]` はデプロイしたいリージョン（例: `asia-northeast1`）に置き換えてください。

## 2. Dockerイメージのビルドとプッシュ

次に、アプリケーションのDockerイメージをビルドし、Google Artifact Registryにプッシュします。

1.  **Artifact Registryリポジトリの作成:**
    （まだリポジトリがない場合）
    ```bash
    gcloud artifacts repositories create [REPOSITORY_NAME] --repository-format=docker --location=[YOUR_REGION]
    ```
    `[REPOSITORY_NAME]` は任意のリポジトリ名に置き換えてください。

2.  **Dockerの認証設定:**
    ```bash
    gcloud auth configure-docker [YOUR_REGION]-docker.pkg.dev
    ```

3.  **Dockerイメージのビルド (安全な方法):**
    APIキーのような機密情報がDockerイメージの履歴に残らないようにするため、Dockerの`--secret`機能を使用します。この方法は、ビルド中にのみシークレットを安全にマウントします。

    **a. シークレットファイルの作成:**
    プロジェクトのルートに `.gemini_secret` という名前のファイルを作成し、その中にAPIキーの値のみを貼り付けます。（このファイルは`.gitignore`によってリポジトリには含まれません。）

    **b. Dockerイメージのビルド:**
    `DOCKER_BUILDKIT=1` を設定してBuildKitを有効にし、`--secret`フラグを使ってイメージをビルドします。

    ```bash
    DOCKER_BUILDKIT=1 docker build --secret id=gemini_api_key,src=.gemini_secret -t [YOUR_REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest .
    ```
    - `[IMAGE_NAME]` は任意のイメージ名（例: `my-react-app`）に置き換えてください。
    - `id=gemini_api_key` は `Dockerfile` 内の `RUN --mount` で指定したIDと一致している必要があります。

4.  **Dockerイメージのプッシュ:**
    ```bash
    docker push [YOUR_REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest
    ```

## 3. Cloud Runへのデプロイ

最後に、プッシュしたDockerイメージをCloud Runにデプロイします。

```bash
gcloud run deploy [SERVICE_NAME] \
  --image [YOUR_REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest \
  --platform managed \
  --allow-unauthenticated
```
`[SERVICE_NAME]` はCloud Runのサービス名に置き換えてください。

`--allow-unauthenticated` フラグは、誰でもアクセスできる公開サービスを作成します。認証が必要な場合は、このフラグを削除してください。

デプロイが完了すると、サービスのURLが出力されます。そのURLにアクセスして、アプリケーションが正しく動作していることを確認してください。

## 4. アプリケーションの更新と再デプロイ

アプリケーションのコードや`Dockerfile`を変更した場合は、以下の手順でサービスを更新します。`Dockerfile`のポート設定を修正した今回のケースも、この手順に従って再デプロイしてください。

1.  **Dockerイメージの再ビルド:**
    変更を反映した新しいDockerイメージをビルドします。安全な`--secret`メソッドを使用することを忘れないでください。
    ```bash
    DOCKER_BUILDKIT=1 docker build --secret id=gemini_api_key,src=.gemini_secret -t [YOUR_REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest .
    ```

2.  **Dockerイメージの再プッシュ:**
    新しいイメージをArtifact Registryにプッシュします。
    ```bash
    docker push [YOUR_REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest
    ```

3.  **Cloud Runサービスの更新:**
    再度`gcloud run deploy`コマンドを実行します。Cloud Runは同じサービス名でデプロイされたことを検知し、新しいイメージを使用してサービスを更新します。
    ```bash
    gcloud run deploy [SERVICE_NAME] \
      --image [YOUR_REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest \
      --platform managed \
      --allow-unauthenticated
    ```
    これにより、ダウンタイムなしで新しいバージョンにトラフィックが移行されます。
