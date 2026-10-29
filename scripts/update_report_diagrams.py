import io
import os
import shutil
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

FILE_PATH = 'PHẦN 1, 2, 3 - TÀI LIỆU YÊU CẦU VÀ THIẾT KẾ HỆ THỐNG QUẢN LÝ SÂN THỂ THAO.md'
BACKUP_PATH = FILE_PATH + '.bak'

if not os.path.exists(BACKUP_PATH):
    shutil.copy2(FILE_PATH, BACKUP_PATH)
    print(f'Created backup at {BACKUP_PATH}')

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Exact mapping for the 11 base64 image lines
# 0: Line 103 -> 11_activity_asis_process.png
# 1: Line 157 -> 10_mindmap_requirements.png
# 2: Line 185 -> 06_usecase_general.png
# 3: Line 195 -> 07_usecase_customer_ai.png
# 4: Line 205 -> 09_usecase_admin_ai.png
# 5: Line 211 -> 08_usecase_online_booking.png
# 6: Line 347 -> 04_sequence_customer_chat.png
# 7: Line 355 -> 05_sequence_admin_revenue.png
# 8: Line 365 -> 03_activity_ai_workflow.png
# 9: Line 373 -> 02_bce_class_diagram.png
# 10: Line 381 -> 01_erd_database.png

replacement_map = [
    '![Sơ đồ Quy trình Hiện trạng Thủ công (As-Is Process Flowchart)](docs/diagrams/rendered/11_activity_asis_process.png)\n',
    '![Sơ đồ Tư duy Tổng hợp Yêu cầu Bài toán (Requirements Mindmap)](docs/diagrams/rendered/10_mindmap_requirements.png)\n',
    '![Hình 3.1: Sơ đồ tổng quan Use Case hệ thống quản lý sân thể thao tích hợp AI](docs/diagrams/rendered/06_usecase_general.png)\n',
    '![Hình 3.2: Biểu đồ Use Case phân rã gói chức năng Trợ lý AI Hỏi Đáp dành cho Khách hàng](docs/diagrams/rendered/07_usecase_customer_ai.png)\n',
    '![Hình 3.3: Biểu đồ Use Case phân rã gói chức năng Quản trị & Báo cáo Thông minh AI](docs/diagrams/rendered/09_usecase_admin_ai.png)\n',
    '![Hình 3.4: Biểu đồ Use Case phân rã gói chức năng Đặt sân và Dịch vụ trực tuyến](docs/diagrams/rendered/08_usecase_online_booking.png)\n',
    '![Hình 3.6.1: Sơ đồ tuần tự Khách hàng hỏi đáp AI tra cứu sân trống](docs/diagrams/rendered/04_sequence_customer_chat.png)\n',
    '![Hình 3.6.2: Sơ đồ tuần tự Chủ sân trích xuất báo cáo doanh thu AI](docs/diagrams/rendered/05_sequence_admin_revenue.png)\n',
    '![Hình 3.7.1: Sơ đồ hoạt động luồng xử lý câu hỏi Chatbot AI](docs/diagrams/rendered/03_activity_ai_workflow.png)\n',
    '![Hình 3.8: Biểu đồ lớp phân tích BCE](docs/diagrams/rendered/02_bce_class_diagram.png)\n',
    '![Hình 4.1: Sơ đồ quan hệ thực thể CSDL (ERD)](docs/diagrams/rendered/01_erd_database.png)\n',
]

match_count = 0
for idx, line in enumerate(lines):
    if 'data:image/png;base64' in line:
        if match_count < len(replacement_map):
            old_len = len(line)
            lines[idx] = replacement_map[match_count]
            print(f'Replaced image #{match_count+1} at Line {idx+1}: {old_len} chars -> {len(lines[idx])} chars')
            match_count += 1

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.writelines(lines)

new_size = os.path.getsize(FILE_PATH)
print(f'Successfully replaced {match_count} images. New file size: {new_size:,} bytes')

