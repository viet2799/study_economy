# Multi-Device Handoff

Nếu bạn dùng Codex/AI trên nhiều thiết bị, đừng kỳ vọng agent tự nhớ đúng toàn bộ ngữ cảnh giữa các máy.

Cách làm đúng là:

1. dùng cùng một repo Git
2. push/pull cùng branch
3. lưu ngữ cảnh dự án vào file trong repo
4. ở thiết bị mới, yêu cầu agent đọc các file handoff trước khi làm việc

## Bộ file nên đọc theo thứ tự

1. `project-memory.md`
2. `current-status.md`
3. `next-steps.md`
4. các tài liệu domain trong `docs/ecommerce/`

## Quy ước

- `project-memory.md`: thông tin ổn định, ít đổi
- `current-status.md`: trạng thái hiện tại của dự án
- `next-steps.md`: việc tiếp theo cần làm
- `session-template.md`: mẫu bàn giao nhanh giữa các phiên làm việc
- `bootstrap-prompt.md`: prompt ngắn để dán ở thiết bị mới

## Cách dùng khi đổi thiết bị

1. `git pull`
2. mở workspace
3. dán nội dung trong `bootstrap-prompt.md`
4. nếu vừa kết thúc một phiên làm việc lớn, cập nhật `current-status.md` và `next-steps.md`

## Mục tiêu

Mục tiêu không phải để AI "nhớ".

Mục tiêu là để mọi agent:

- đọc cùng một nguồn sự thật
- hiểu cùng một quyết định kiến trúc
- không bị lệch ngữ cảnh khi đổi máy
