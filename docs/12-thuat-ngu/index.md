# 12. Thuật ngữ

> arc42 §12 — *Glossary*. Thuật ngữ nghiệp vụ & kỹ thuật dùng xuyên suốt.

| Thuật ngữ | Nghĩa |
|---|---|
| **Lead** | Khách tiềm năng từ Messenger/form; phễu L1→L2→L3 (SR.QD.217) |
| **Convert** | Chuyển Lead → Học viên + Enrollment (`convertLeadV2`, atomic) |
| **Enrollment** | Bản ghi ghi danh học viên vào lớp |
| **ClassSession** | Một buổi học cụ thể của lớp |
| **Attendance** | Điểm danh buổi (PRESENT/ABSENT/LATE/EXCUSED) |
| **MakeupNeed** | Nhu cầu học bù khi vắng (NEEDS_MAKEUP) |
| **ReportCard** | Học bạ/phiếu năng lực (DRAFT→PENDING_REVIEW→PUBLISHED) |
| **CourseCompletion** | Hoàn thành khoá + chứng chỉ (`certificateCode`) |
| **OrgUnit** | Đơn vị tổ chức (ROOT → HO/CS1/CS2…) |
| **scopedDb** | Lớp truy vấn ép cách ly cơ sở theo `centerId` |
| **DomainEvent** | Sự kiện miền (outbox) tách side-effect không-atomic |
| **Actor** | Ngữ cảnh quyền của người dùng (`resolveActor`) — vai trò + cơ sở thấy được |
| **HO / CS1 / CS2** | Hội sở / Cơ sở 1 / Cơ sở 2 (độc lập ngang hàng dưới ROOT) |
| **Combo 1&2** | Gói khoá học kết hợp |
| **SCORM** | Chuẩn đóng gói học liệu tương tác (cho GV trình chiếu) |
| **Portal view** | Cookie `portal_view` (`parent`/`student`) trên tài khoản PARENT |

## Vai trò RBAC (9)
`SUPER_ADMIN` · `CENTER_MANAGER` · `TRAINING` (Phòng Đào tạo) · `TEACHER` · `SALES_CSM` · `ACCOUNTANT` · `MARKETING` · `HR` · `PARENT`.
