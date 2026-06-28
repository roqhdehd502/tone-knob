-- ============================================================
-- media-svc 파일 업로드용 Storage 버킷 생성
-- ============================================================
-- media-svc StorageService가 사용하는 버킷 (기본값 SUPABASE_STORAGE_BUCKET=media)
-- public=true: getPublicUrl()로 발급한 URL이 별도 서명 없이 바로 접근 가능해야 하므로 공개 버킷으로 생성
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800) -- 50MiB, config.toml의 storage.file_size_limit과 동일
on conflict (id) do nothing;
