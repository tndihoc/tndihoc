/* =====================================================================
   DỮ LIỆU LƯỢNG TỪ cho game "Pikachu lượng từ 连连看" (game-pikachu.js)
   ---------------------------------------------------------------------
   Nguồn: bảng "200 lượng từ tiếng Trung" (chữ Hán – pinyin – nghĩa – ví dụ).
   Chỉ giữ các lượng từ đi với DANH TỪ (bỏ động lượng từ 次/遍/趟/下…, đơn vị thời gian
   秒/天/年…, đơn vị đo 斤/两/克/毫升 và mục 泄).

   CLASSIFIERS: lượng từ → [pinyin, nghĩa ngắn, cấp HSK]
   NOUNS: 'chữ Hán|pinyin|nghĩa|các lượng từ dùng được|cấp HSK' — một danh từ có thể đi với
   nhiều lượng từ; game coi MỌI lượng từ trong danh sách là đáp án đúng.

   CẤP HSK lấy theo danh sách từ vựng HSK 1–9 của web (tu-vung.js): 1–6 = HSK1–6,
   7 = HSK7-9, 0 = không có trong danh sách. Lượng từ chỉ có dạng "X子" trong danh sách
   thì lấy cấp của từ đó (杯 ← 杯子 HSK1, 盘 ← 盘子 HSK3, 句 ← 句子, 盒 ← 盒子).
   Game chia 3 trình độ:  sơ cấp = cấp 1–3 · trung cấp = cấp 1–5 · cao cấp = tất cả.
   ===================================================================== */

export const CLASSIFIERS = {
  个: ['gè', 'cái, người (chung)', 1],
  位: ['wèi', 'vị (lịch sự)', 3],
  名: ['míng', 'người (văn viết)', 0],
  口: ['kǒu', 'nhân khẩu; cái (giếng, nồi)', 3],
  只: ['zhī', 'con; chiếc (một bên của cặp)', 3],
  条: ['tiáo', 'con, sợi, chiếc (vật dài); tin, điều', 3],
  匹: ['pǐ', 'con (ngựa)', 5],
  头: ['tóu', 'con (gia súc lớn)', 0],
  峰: ['fēng', 'con (lạc đà)', 0],
  群: ['qún', 'đàn, nhóm', 5],
  窝: ['wō', 'ổ, lứa (động vật)', 6],
  双: ['shuāng', 'đôi', 3],
  对: ['duì', 'đôi, cặp', 2],
  胎: ['tāi', 'lứa (con non)', 7],
  件: ['jiàn', 'chiếc, món, việc', 2],
  张: ['zhāng', 'tờ, tấm, chiếc (vật phẳng)', 2],
  本: ['běn', 'quyển', 1],
  册: ['cè', 'cuốn, tập', 5],
  支: ['zhī', 'cây (bút); bài (hát)', 5],
  枝: ['zhī', 'cành', 6],
  根: ['gēn', 'sợi, cây, que', 5],
  把: ['bǎ', 'cái (có tay cầm); nắm', 3],
  套: ['tào', 'bộ; căn (nhà)', 5],
  部: ['bù', 'bộ (phim, sách, máy)', 0],
  台: ['tái', 'chiếc (máy móc); buổi (diễn)', 4],
  架: ['jià', 'chiếc (máy bay)', 7],
  辆: ['liàng', 'chiếc (xe)', 3],
  艘: ['sōu', 'chiếc (tàu thuyền)', 6],
  盏: ['zhǎn', 'ngọn (đèn)', 7],
  面: ['miàn', 'tấm, chiếc (gương, cờ, trống)', 6],
  扇: ['shàn', 'cánh (cửa)', 5],
  堵: ['dǔ', 'bức (tường)', 0],
  道: ['dào', 'vệt, luồng; món (ăn); câu (hỏi)', 0],
  片: ['piàn', 'miếng, lát; mảng, vùng', 5],
  块: ['kuài', 'miếng, cục, khối; đồng (tiền)', 1],
  粒: ['lì', 'hạt', 0],
  颗: ['kē', 'hạt, viên, ngôi', 5],
  滴: ['dī', 'giọt', 5],
  滩: ['tān', 'vũng, bãi', 0],
  包: ['bāo', 'gói', 3],
  袋: ['dài', 'túi, bao', 0],
  盒: ['hé', 'hộp', 4],
  箱: ['xiāng', 'thùng, hòm', 0],
  瓶: ['píng', 'chai, lọ', 0],
  罐: ['guàn', 'lon, hũ', 6],
  杯: ['bēi', 'cốc, ly', 1],
  碗: ['wǎn', 'bát', 3],
  盘: ['pán', 'đĩa; ván (cờ)', 3],
  碟: ['dié', 'đĩa nhỏ', 7],
  盆: ['pén', 'chậu', 5],
  桶: ['tǒng', 'xô, thùng', 0],
  勺: ['sháo', 'thìa', 4],
  壶: ['hú', 'ấm, bình', 5],
  所: ['suǒ', 'ngôi (trường, viện)', 5],
  家: ['jiā', '(cửa hàng, công ty)', 1],
  间: ['jiān', 'gian, phòng', 0],
  栋: ['dòng', 'toà (nhà)', 6],
  座: ['zuò', 'toà, ngọn, cây (cầu)', 4],
  幢: ['zhuàng', 'toà (nhà)', 6],
  层: ['céng', 'tầng, lớp', 3],
  处: ['chù', 'nơi, chỗ', 0],
  堂: ['táng', 'tiết (học)', 7],
  篇: ['piān', 'bài (văn)', 4],
  节: ['jié', 'tiết (học)', 4],
  段: ['duàn', 'đoạn', 3],
  句: ['jù', 'câu', 3],
  行: ['háng', 'dòng', 4],
  页: ['yè', 'trang', 4],
  封: ['fēng', 'bức (thư)', 0],
  则: ['zé', 'mẩu (tin, chuyện)', 5],
  首: ['shǒu', 'bài (thơ, hát)', 5],
  曲: ['qǔ', 'khúc (nhạc)', 6],
  集: ['jí', 'tập (phim)', 0],
  场: ['chǎng', 'trận, buổi, cuộc', 4],
  幅: ['fú', 'bức (tranh)', 5],
  帧: ['zhēn', 'khung (hình)', 0],
  份: ['fèn', 'phần, suất, bản', 4],
  项: ['xiàng', 'hạng mục', 5],
  期: ['qī', 'kỳ, số (báo)', 0],
  届: ['jiè', 'khoá, kỳ', 5],
  顿: ['dùn', 'bữa', 5],
  阵: ['zhèn', 'cơn, trận', 5],
  通: ['tōng', 'cuộc (điện thoại)', 0],
  笔: ['bǐ', 'khoản (tiền)', 0],
  桩: ['zhuāng', 'vụ, việc', 7],
  宗: ['zōng', 'vụ, lô', 7],
  起: ['qǐ', 'vụ (tai nạn, án)', 0],
  例: ['lì', 'ca, trường hợp', 0],
  轮: ['lún', 'vòng; vầng (trăng)', 0],
  局: ['jú', 'ván', 0],
  客: ['kè', 'suất (nhà hàng)', 0],
  股: ['gǔ', 'luồng, dòng', 7],
  缕: ['lǚ', 'làn, sợi', 7],
  丝: ['sī', 'sợi, chút', 7],
  弯: ['wān', 'vầng (trăng khuyết)', 0],
  泓: ['hóng', '(dòng nước trong)', 0],
  顶: ['dǐng', 'chiếc (mũ)', 5],
  枚: ['méi', 'chiếc, đồng (vật nhỏ)', 6],
  串: ['chuàn', 'chuỗi, chùm', 6],
  挂: ['guà', 'tràng, dây (treo)', 4],
  捆: ['kǔn', 'bó', 7],
  束: ['shù', 'bó', 6],
  扎: ['zā', 'bó', 6],
  组: ['zǔ', 'nhóm, bộ', 5],
  副: ['fù', 'bộ, cặp', 6],
};

export const NOUNS = `
人|rén|người|个 群 口|1
老师|lǎoshī|giáo viên|个 位 名 群|1
学生|xuésheng|học sinh|个 位 名 群 届|1
客人|kèrén|khách|个 位 群|3
医生|yīshēng|bác sĩ|个 位 名|1
朋友|péngyou|bạn bè|个 位 群|1
孩子|háizi|trẻ con|个 群|2
猫|māo|con mèo|只 群 窝|1
小猫|xiǎomāo|mèo con|只 群 窝 胎|0
狗|gǒu|con chó|只 条 群 窝|1
小狗|xiǎogǒu|chó con|只 条 群 窝 胎|0
鸟|niǎo|con chim|只 群|3
小鸡|xiǎojī|gà con|只 群 窝|0
鱼|yú|con cá|条 群 盘|2
蛇|shé|con rắn|条|5
马|mǎ|con ngựa|匹 群|3
牛|niú|con bò|头 群|0
猪|zhū|con lợn|头 口 群 窝|5
羊|yáng|con dê, cừu|只 头 群|0
骆驼|luòtuo|lạc đà|峰 头 匹 群|0
大象|dàxiàng|con voi|头 只 群|5
蜜蜂|mìfēng|con ong|只 群|5
蚂蚁|mǎyǐ|con kiến|只 群|0
眼睛|yǎnjing|mắt|双 对 只|2
耳朵|ěrduo|tai|只 对 双|3
手|shǒu|tay|只 双|0
翅膀|chìbǎng|cánh (chim)|对 双 只|5
情侣|qínglǚ|cặp tình nhân|对|7
夫妻|fūqī|vợ chồng|对|0
衣服|yīfu|quần áo|件 套|1
裤子|kùzi|quần|条|3
裙子|qúnzi|váy|条|3
鞋|xié|giày|双 只|3
袜子|wàzi|tất|双 只|4
手套|shǒutào|găng tay|双 只 副|5
帽子|màozi|mũ|顶 个|3
围巾|wéijīn|khăn quàng|条|5
领带|lǐngdài|cà vạt|条|0
毛巾|máojīn|khăn mặt|条|4
眼镜|yǎnjìng|kính mắt|副|3
戒指|jièzhi|nhẫn|枚 个|5
奖牌|jiǎngpái|huy chương|枚 块|0
邮票|yóupiào|tem|枚 张 套|0
硬币|yìngbì|đồng xu|枚 个|7
手表|shǒubiǎo|đồng hồ đeo tay|块 只 个|2
纸|zhǐ|giấy|张 页|0
照片|zhàopiàn|ảnh|张 组|3
桌子|zhuōzi|cái bàn|张 个|1
床|chuáng|cái giường|张|0
脸|liǎn|khuôn mặt|张|3
地图|dìtú|bản đồ|张 幅|3
票|piào|vé|张|2
书|shū|sách|本 册 套 箱 捆 页|1
词典|cídiǎn|từ điển|本 部 册|0
杂志|zázhì|tạp chí|本 期 份|4
日记|rìjì|nhật ký|篇 本|4
笔|bǐ|bút|支 枝|0
铅笔|qiānbǐ|bút chì|支 枝 根|3
花|huā|hoa|枝 束 盆 扎|3
鲜花|xiānhuā|hoa tươi|束 扎 枝|0
绳子|shéngzi|dây thừng|根 条 段|5
头发|tóufa|tóc|根 缕 头|3
筷子|kuàizi|đũa|双 根 副|3
椅子|yǐzi|cái ghế|把 张 个|1
伞|sǎn|cái ô|把|3
刀|dāo|con dao|把|4
钥匙|yàoshi|chìa khoá|把 串|4
工具|gōngjù|dụng cụ|套 件 把|5
行李|xíngli|hành lý|件 个|0
礼物|lǐwù|quà|份 个 件|3
电影|diànyǐng|phim điện ảnh|部 场|1
电视剧|diànshìjù|phim truyền hình|部 集|0
手机|shǒujī|điện thoại di động|部 台 个|2
电脑|diànnǎo|máy tính|台 部|1
电视|diànshì|tivi|台|1
冰箱|bīngxiāng|tủ lạnh|台|3
飞机|fēijī|máy bay|架|1
汽车|qìchē|ô tô|辆 部|0
自行车|zìxíngchē|xe đạp|辆|2
船|chuán|thuyền|艘 条 只|2
灯|dēng|đèn|盏 个|3
锅|guō|cái nồi|口 个|5
井|jǐng|giếng|口|6
镜子|jìngzi|gương|面 个|4
旗子|qízi|lá cờ|面|0
鼓|gǔ|cái trống|面|0
门|mén|cửa|扇 道 个|2
窗户|chuānghu|cửa sổ|扇 个|4
墙|qiáng|bức tường|堵 面 道|5
面包|miànbāo|bánh mì|片 块 个|3
蛋糕|dàngāo|bánh ngọt|块 个 盒 层|3
饼干|bǐnggān|bánh quy|包 块 盒 袋|4
糖|táng|kẹo, đường|颗 块 粒 包 袋 勺 盒|3
巧克力|qiǎokèlì|sô-cô-la|块 盒 颗 包|4
水|shuǐ|nước|滴 杯 瓶 桶 壶 碗 盆 滩|1
牛奶|niúnǎi|sữa|杯 瓶 盒 箱 袋 罐|2
可乐|kělè|cô-ca|罐 瓶 杯 箱|0
茶|chá|trà|杯 壶 碗 包|1
咖啡|kāfēi|cà phê|杯 壶 罐|2
啤酒|píjiǔ|bia|瓶 杯 罐 箱 桶 扎|3
酒|jiǔ|rượu|杯 瓶 壶|0
油|yóu|dầu ăn|桶 瓶 滴 勺|0
苹果|píngguǒ|quả táo|个 箱 袋 盘|1
葡萄|pútao|nho|颗 粒 串 盘|3
香蕉|xiāngjiāo|chuối|根 串 个|3
花生|huāshēng|lạc|粒 颗 碟 包 袋 把 盘|5
米|mǐ|gạo|粒 把 袋 碗 包|3
米饭|mǐfàn|cơm|碗 粒|1
饭|fàn|bữa cơm|顿 碗 口|0
面条|miàntiáo|mì sợi|碗 根 盘 包|3
饺子|jiǎozi|sủi cảo|盘 碗 个 只|4
菜|cài|món ăn|盘 道 碟 碗|1
汤|tāng|canh|碗 勺 份|4
炒饭|chǎofàn|cơm rang|份 盘 碗 客|0
牛排|niúpái|bít tết|客 份 块|0
肉|ròu|thịt|块 片|0
酱油|jiàngyóu|xì dầu|碟 瓶 勺 滴|5
蜂蜜|fēngmì|mật ong|罐 瓶 勺 滴|7
盐|yán|muối|勺 包 袋|4
药|yào|thuốc|粒 片 颗 包 瓶|2
珍珠|zhēnzhū|ngọc trai|颗 粒 串|6
学校|xuéxiào|trường học|所 个|1
医院|yīyuàn|bệnh viện|所 家 个 座|1
公司|gōngsī|công ty|家 个|2
商店|shāngdiàn|cửa hàng|家 个 间|1
饭馆|fànguǎn|quán ăn|家 个 间|1
房间|fángjiān|căn phòng|间 个|2
办公室|bàngōngshì|văn phòng|间 个|3
房子|fángzi|ngôi nhà|套 栋 座 间 所 幢 处 个|0
大楼|dàlóu|toà nhà lớn|栋 座 幢|0
楼|lóu|toà nhà, lầu|栋 座 幢 层|3
山|shān|ngọn núi|座|0
桥|qiáo|cây cầu|座|4
街|jiē|con phố|条|0
路|lù|con đường|条 段|2
河|hé|dòng sông|条|3
地方|dìfang|nơi, chỗ|个 处|3
景点|jǐngdiǎn|điểm tham quan|个 处|0
名胜|míngshèng|danh lam thắng cảnh|处|0
空地|kòngdì|bãi đất trống|块 片|0
堤坝|dībà|con đê|道 条 座|6
森林|sēnlín|khu rừng|片|4
树叶|shùyè|lá cây|片|0
课|kè|bài học, tiết học|节 堂|2
文章|wénzhāng|bài văn|篇|4
小说|xiǎoshuō|tiểu thuyết|部 本 篇|4
信|xìn|bức thư|封|3
话|huà|lời nói|句 段|0
字|zì|chữ|个 行|1
诗|shī|bài thơ|首 行|5
歌|gē|bài hát|首 支 曲|0
民歌|míngē|dân ca|首 曲 支|0
画|huà|bức tranh|幅 张|3
画面|huàmiàn|khung hình|帧 幅 个|0
报告|bàogào|bản báo cáo|份 篇 个|5
报纸|bàozhǐ|tờ báo|份 张|2
研究|yánjiū|công trình nghiên cứu|项 个|4
任务|rènwu|nhiệm vụ|项 个|4
工作|gōngzuò|công việc|份 项 个|1
寓言|yùyán|truyện ngụ ngôn|则 个 篇|6
故事|gùshi|câu chuyện|个 则 段|3
新闻|xīnwén|tin tức|条 则|3
消息|xiāoxi|tin nhắn, tin tức|条 个 则|4
规定|guīdìng|quy định|条 项|4
节目|jiémù|chương trình|个 期 台|3
数据|shùjù|dữ liệu|组 项|5
题|tí|câu hỏi, bài tập|道 个|2
时间|shíjiān|thời gian|段|2
事情|shìqing|sự việc|件 桩 个|2
比赛|bǐsài|cuộc thi đấu|场 轮 局 个|3
奥运会|àoyùnhuì|Thế vận hội|届|0
考试|kǎoshì|kỳ thi|场|2
演出|yǎnchū|buổi biểu diễn|场 台|4
电话|diànhuà|cuộc gọi, điện thoại|通 个 部|0
钱|qián|tiền|笔 块|1
生意|shēngyi|việc làm ăn|笔 桩 宗|4
案件|ànjiàn|vụ án|起 宗 桩 个|6
事故|shìgù|tai nạn|起 场|6
病例|bìnglì|ca bệnh|例 个|0
棋|qí|cờ|盘 局 副|0
扑克|pūkè|bộ bài tây|副|7
风|fēng|gió|阵 股 缕|0
雨|yǔ|mưa|场 阵 滴|0
雪|xuě|tuyết|场|2
掌声|zhǎngshēng|tràng vỗ tay|阵|0
闪电|shǎndiàn|tia chớp|道|5
彩虹|cǎihóng|cầu vồng|道|5
星星|xīngxing|ngôi sao|颗|0
心|xīn|trái tim|颗|0
眼泪|yǎnlèi|nước mắt|滴|0
月亮|yuèliang|mặt trăng|轮 弯 个|3
太阳|tàiyáng|mặt trời|轮 个|3
明月|míngyuè|trăng sáng|轮|0
新月|xīnyuè|trăng non|弯|0
阳光|yángguāng|ánh nắng|缕 束 道 丝 片|4
烟|yān|khói|缕 股 丝|0
凉意|liángyì|hơi mát lạnh|丝 股|0
暖流|nuǎnliú|dòng ấm áp|股|0
香味|xiāngwèi|mùi thơm|股 丝 阵|0
清泉|qīngquán|suối trong|泓 股|0
湖水|húshuǐ|nước hồ|泓 片|0
泥|ní|bùn|滩 块|0
柴|chái|củi|捆 根 把|0
鞭炮|biānpào|tràng pháo|挂 串|5
名字|míngzi|tên|个|1
问题|wèntí|câu hỏi, vấn đề|个 道|2
同学|tóngxué|bạn học|个 位 名 群|1
男人|nánrén|đàn ông|个 群|2
女人|nǚrén|phụ nữ|个 群|2
熊猫|xióngmāo|gấu trúc|只 群|3
草|cǎo|cỏ|片 根|3
出租车|chūzūchē|taxi|辆 部|1
公共汽车|gōnggòng qìchē|xe buýt|辆 部|2
菜单|càidān|thực đơn|份 张 个|3
宾馆|bīnguǎn|khách sạn|家 个 座|3
银行|yínháng|ngân hàng|家 个|3
超市|chāoshì|siêu thị|家 个|3
机场|jīchǎng|sân bay|个 座|2
教室|jiàoshì|phòng học|间 个|2
电梯|diàntī|thang máy|部 台 个|3
空调|kōngtiáo|điều hoà|台 个|3
照相机|zhàoxiàngjī|máy ảnh|台 部 个|3
黑板|hēibǎn|bảng đen|块 个|3
作业|zuòyè|bài tập về nhà|份 道|3
衬衫|chènshān|áo sơ mi|件|3
西瓜|xīguā|dưa hấu|个 块 片|2
鸡蛋|jīdàn|trứng gà|个 盒|2
羊肉|yángròu|thịt cừu|块 片|2
水果|shuǐguǒ|hoa quả|盘 箱 袋 份|1
包|bāo|cái túi|个 只|3
行李箱|xínglixiāng|va-li|个 只|3
护照|hùzhào|hộ chiếu|本|3
字典|zìdiǎn|từ điển (chữ)|本 部|3
果汁|guǒzhī|nước ép|杯 瓶 盒 罐|3
城市|chéngshì|thành phố|座 个|3
国家|guójiā|quốc gia|个|3
公园|gōngyuán|công viên|个 座|3
街道|jiēdào|đường phố|条|3
节日|jiérì|ngày lễ|个|3
办法|bànfǎ|cách, biện pháp|个|3
词语|cíyǔ|từ ngữ|个 组|3
花园|huāyuán|vườn hoa|个 座|3
声音|shēngyīn|âm thanh|个 阵|3
腿|tuǐ|chân (cẳng chân)|条 双 只|3
脚|jiǎo|bàn chân|只 双|3
杯子|bēizi|cái cốc|个 只|1
盘子|pánzi|cái đĩa|个 只|3
汉语|Hànyǔ|tiếng Hán|句|1
`.trim().split('\n').map(line => {
  const [h, p, v, cl, hsk] = line.split('|');
  return { h, p, v, cl: cl.trim().split(/\s+/), hsk: +hsk || 0 };
});

/* NGHĨA CỤ THỂ CỦA TỪNG CỤM "一 + lượng từ + danh từ" (hiện khi nối đúng và ở bảng kết quả):
   'lượng từ + danh từ=nghĩa tiếng Việt', ví dụ 粒米饭=một hạt cơm · 碗米饭=một bát cơm.
   Thêm danh từ / lượng từ mới ở NOUNS thì thêm dòng tương ứng ở đây (thiếu thì game tự ghép
   "một" + nghĩa lượng từ + nghĩa danh từ). */
export const PHRASE_VI = Object.fromEntries(`
个人=một người
群人=một nhóm người
口人=một nhân khẩu
个老师=một giáo viên
位老师=một thầy/cô giáo (lịch sự)
名老师=một giáo viên
群老师=một nhóm giáo viên
个学生=một học sinh
位学生=một em học sinh (lịch sự)
名学生=một học sinh
群学生=một nhóm học sinh
届学生=một khoá học sinh
个客人=một vị khách
位客人=một vị khách (lịch sự)
群客人=một đoàn khách
个医生=một bác sĩ
位医生=một vị bác sĩ
名医生=một bác sĩ
个朋友=một người bạn
位朋友=một người bạn (lịch sự)
群朋友=một nhóm bạn
个孩子=một đứa trẻ
群孩子=một đám trẻ
只猫=một con mèo
群猫=một đàn mèo
窝猫=một ổ mèo
只小猫=một con mèo con
群小猫=một đàn mèo con
窝小猫=một ổ mèo con
胎小猫=một lứa mèo con
只狗=một con chó
条狗=một con chó
群狗=một đàn chó
窝狗=một ổ chó
只小狗=một con chó con
条小狗=một con chó con
群小狗=một đàn chó con
窝小狗=một ổ chó con
胎小狗=một lứa chó con
只鸟=một con chim
群鸟=một đàn chim
只小鸡=một con gà con
群小鸡=một đàn gà con
窝小鸡=một ổ gà con
条鱼=một con cá
群鱼=một đàn cá
盘鱼=một đĩa cá
条蛇=một con rắn
匹马=một con ngựa
群马=một đàn ngựa
头牛=một con bò
群牛=một đàn bò
头猪=một con lợn
口猪=một con lợn
群猪=một đàn lợn
窝猪=một ổ lợn
只羊=một con dê / cừu
头羊=một con dê / cừu
群羊=một đàn dê / cừu
峰骆驼=một con lạc đà
头骆驼=một con lạc đà
匹骆驼=một con lạc đà
群骆驼=một đàn lạc đà
头大象=một con voi
只大象=một con voi
群大象=một đàn voi
只蜜蜂=một con ong
群蜜蜂=một đàn ong
只蚂蚁=một con kiến
群蚂蚁=một đàn kiến
双眼睛=một đôi mắt
对眼睛=một đôi mắt
只眼睛=một bên mắt
只耳朵=một bên tai
对耳朵=một đôi tai
双耳朵=một đôi tai
只手=một bàn tay
双手=một đôi bàn tay
对翅膀=một đôi cánh
双翅膀=một đôi cánh
只翅膀=một bên cánh
对情侣=một cặp tình nhân
对夫妻=một cặp vợ chồng
件衣服=một chiếc áo
套衣服=một bộ quần áo
条裤子=một chiếc quần
条裙子=một chiếc váy
双鞋=một đôi giày
只鞋=một chiếc giày
双袜子=một đôi tất
只袜子=một chiếc tất
双手套=một đôi găng tay
只手套=một chiếc găng tay
副手套=một đôi găng tay
顶帽子=một chiếc mũ
个帽子=một cái mũ
条围巾=một chiếc khăn quàng
条领带=một chiếc cà vạt
条毛巾=một chiếc khăn mặt
副眼镜=một cặp kính
枚戒指=một chiếc nhẫn
个戒指=một cái nhẫn
枚奖牌=một tấm huy chương
块奖牌=một tấm huy chương
枚邮票=một con tem
张邮票=một con tem
套邮票=một bộ tem
枚硬币=một đồng xu
个硬币=một đồng xu
块手表=một chiếc đồng hồ đeo tay
只手表=một chiếc đồng hồ đeo tay
个手表=một cái đồng hồ đeo tay
张纸=một tờ giấy
页纸=một trang giấy
张照片=một tấm ảnh
组照片=một bộ ảnh
张桌子=một cái bàn
个桌子=một cái bàn
张床=một cái giường
张脸=một khuôn mặt
张地图=một tấm bản đồ
幅地图=một tấm bản đồ
张票=một tấm vé
本书=một quyển sách
册书=một cuốn sách
套书=một bộ sách
箱书=một thùng sách
捆书=một bó sách
页书=một trang sách
本词典=một quyển từ điển
部词典=một bộ từ điển
册词典=một cuốn từ điển
本杂志=một quyển tạp chí
期杂志=một số tạp chí
份杂志=một tờ tạp chí
篇日记=một trang/bài nhật ký
本日记=một quyển nhật ký
支笔=một cây bút
枝笔=một cây bút
支铅笔=một cây bút chì
枝铅笔=một cây bút chì
根铅笔=một cây bút chì
枝花=một cành hoa
束花=một bó hoa
盆花=một chậu hoa
扎花=một bó hoa
束鲜花=một bó hoa tươi
扎鲜花=một bó hoa tươi
枝鲜花=một cành hoa tươi
根绳子=một sợi dây thừng
条绳子=một sợi dây thừng
段绳子=một đoạn dây thừng
根头发=một sợi tóc
缕头发=một lọn tóc
头头发=một mái tóc
双筷子=một đôi đũa
根筷子=một chiếc đũa
副筷子=một đôi đũa
把椅子=một cái ghế
张椅子=một cái ghế
个椅子=một cái ghế
把伞=một cái ô
把刀=một con dao
把钥匙=một chiếc chìa khoá
串钥匙=một chùm chìa khoá
套工具=một bộ dụng cụ
件工具=một món dụng cụ
把工具=một cái dụng cụ (có cán cầm)
件行李=một kiện hành lý
个行李=một kiện hành lý
份礼物=một phần quà
个礼物=một món quà
件礼物=một món quà
部电影=một bộ phim
场电影=một suất chiếu phim
部电视剧=một bộ phim truyền hình
集电视剧=một tập phim truyền hình
部手机=một chiếc điện thoại di động
台手机=một chiếc điện thoại di động
个手机=một cái điện thoại di động
台电脑=một chiếc máy tính
部电脑=một chiếc máy tính
台电视=một chiếc tivi
台冰箱=một chiếc tủ lạnh
架飞机=một chiếc máy bay
辆汽车=một chiếc ô tô
部汽车=một chiếc ô tô
辆自行车=một chiếc xe đạp
艘船=một chiếc thuyền
条船=một con thuyền
只船=một chiếc thuyền
盏灯=một ngọn đèn
个灯=một cái đèn
口锅=một cái nồi
个锅=một cái nồi
口井=một cái giếng
面镜子=một tấm gương
个镜子=một cái gương
面旗子=một lá cờ
面鼓=một cái trống
扇门=một cánh cửa
道门=một lớp cửa
个门=một cái cửa
扇窗户=một cánh cửa sổ
个窗户=một cái cửa sổ
堵墙=một bức tường
面墙=một bức tường
道墙=một bức tường
片面包=một lát bánh mì
块面包=một miếng bánh mì
个面包=một chiếc bánh mì
块蛋糕=một miếng bánh ngọt
个蛋糕=một chiếc bánh ngọt
盒蛋糕=một hộp bánh ngọt
层蛋糕=một tầng bánh ngọt
包饼干=một gói bánh quy
块饼干=một chiếc bánh quy
盒饼干=một hộp bánh quy
袋饼干=một túi bánh quy
颗糖=một viên kẹo
块糖=một viên kẹo / cục đường
粒糖=một viên kẹo
包糖=một gói kẹo
袋糖=một túi kẹo / đường
勺糖=một thìa đường
盒糖=một hộp kẹo
块巧克力=một miếng sô-cô-la
盒巧克力=một hộp sô-cô-la
颗巧克力=một viên sô-cô-la
包巧克力=một gói sô-cô-la
滴水=một giọt nước
杯水=một cốc nước
瓶水=một chai nước
桶水=một xô nước
壶水=một ấm nước
碗水=một bát nước
盆水=một chậu nước
滩水=một vũng nước
杯牛奶=một cốc sữa
瓶牛奶=một chai sữa
盒牛奶=một hộp sữa
箱牛奶=một thùng sữa
袋牛奶=một túi sữa
罐牛奶=một lon sữa
罐可乐=một lon cô-ca
瓶可乐=một chai cô-ca
杯可乐=một cốc cô-ca
箱可乐=một thùng cô-ca
杯茶=một cốc trà
壶茶=một ấm trà
碗茶=một bát trà
包茶=một gói trà
杯咖啡=một cốc cà phê
壶咖啡=một bình cà phê
罐咖啡=một lon cà phê
瓶啤酒=một chai bia
杯啤酒=một cốc bia
罐啤酒=một lon bia
箱啤酒=một thùng bia
桶啤酒=một thùng bia
扎啤酒=một vại bia
杯酒=một chén rượu
瓶酒=một chai rượu
壶酒=một bình rượu
桶油=một thùng dầu ăn
瓶油=một chai dầu ăn
滴油=một giọt dầu ăn
勺油=một thìa dầu ăn
个苹果=một quả táo
箱苹果=một thùng táo
袋苹果=một túi táo
盘苹果=một đĩa táo
颗葡萄=một quả nho
粒葡萄=một quả nho
串葡萄=một chùm nho
盘葡萄=một đĩa nho
根香蕉=một quả chuối
串香蕉=một nải chuối
个香蕉=một quả chuối
粒花生=một hạt lạc
颗花生=một hạt lạc
碟花生=một đĩa lạc
包花生=một gói lạc
袋花生=một túi lạc
把花生=một nắm lạc
盘花生=một đĩa lạc
粒米=một hạt gạo
把米=một nắm gạo
袋米=một bao gạo
碗米=một bát gạo
包米=một gói gạo
碗米饭=một bát cơm
粒米饭=một hạt cơm
顿饭=một bữa cơm
碗饭=một bát cơm
口饭=một miếng cơm
碗面条=một bát mì
根面条=một sợi mì
盘面条=một đĩa mì
包面条=một gói mì
盘饺子=một đĩa sủi cảo
碗饺子=một bát sủi cảo
个饺子=một chiếc sủi cảo
只饺子=một chiếc sủi cảo
盘菜=một đĩa thức ăn
道菜=một món ăn
碟菜=một đĩa thức ăn
碗菜=một bát thức ăn
碗汤=một bát canh
勺汤=một thìa canh
份汤=một suất canh
份炒饭=một suất cơm rang
盘炒饭=một đĩa cơm rang
碗炒饭=một bát cơm rang
客炒饭=một suất cơm rang
客牛排=một suất bít tết
份牛排=một phần bít tết
块牛排=một miếng bít tết
块肉=một miếng thịt
片肉=một lát thịt
碟酱油=một đĩa xì dầu
瓶酱油=một chai xì dầu
勺酱油=một thìa xì dầu
滴酱油=một giọt xì dầu
罐蜂蜜=một hũ mật ong
瓶蜂蜜=một lọ mật ong
勺蜂蜜=một thìa mật ong
滴蜂蜜=một giọt mật ong
勺盐=một thìa muối
包盐=một gói muối
袋盐=một túi muối
粒药=một viên thuốc
片药=một viên thuốc (dạng nén)
颗药=một viên thuốc
包药=một gói thuốc
瓶药=một lọ thuốc
颗珍珠=một viên ngọc trai
粒珍珠=một hạt ngọc trai
串珍珠=một chuỗi ngọc trai
所学校=một ngôi trường
个学校=một trường học
所医院=một bệnh viện
家医院=một bệnh viện
个医院=một bệnh viện
座医院=một toà bệnh viện
家公司=một công ty
个公司=một công ty
家商店=một cửa hàng
个商店=một cửa hàng
间商店=một gian hàng
家饭馆=một quán ăn
个饭馆=một quán ăn
间饭馆=một gian quán ăn
间房间=một căn phòng
个房间=một căn phòng
间办公室=một phòng làm việc
个办公室=một văn phòng
套房子=một căn hộ / căn nhà
栋房子=một toà nhà
座房子=một ngôi nhà
间房子=một gian nhà
所房子=một ngôi nhà
幢房子=một toà nhà
处房子=một chỗ nhà
个房子=một ngôi nhà
栋大楼=một toà nhà lớn
座大楼=một toà nhà lớn
幢大楼=một toà nhà lớn
栋楼=một toà nhà
座楼=một toà nhà
幢楼=một toà nhà
层楼=một tầng lầu
座山=một ngọn núi
座桥=một cây cầu
条街=một con phố
条路=một con đường
段路=một đoạn đường
条河=một dòng sông
个地方=một nơi
处地方=một chỗ
个景点=một điểm tham quan
处景点=một điểm tham quan
处名胜=một danh lam thắng cảnh
块空地=một mảnh đất trống
片空地=một bãi đất trống
道堤坝=một con đê
条堤坝=một con đê
座堤坝=một con đập
片森林=một khu rừng
片树叶=một chiếc lá
节课=một tiết học
堂课=một tiết học
篇文章=một bài văn
部小说=một bộ tiểu thuyết
本小说=một quyển tiểu thuyết
篇小说=một truyện ngắn
封信=một bức thư
句话=một câu nói
段话=một đoạn lời nói
个字=một chữ
行字=một dòng chữ
首诗=một bài thơ
行诗=một câu thơ
首歌=một bài hát
支歌=một bài hát
曲歌=một khúc hát
首民歌=một bài dân ca
曲民歌=một khúc dân ca
支民歌=một bài dân ca
幅画=một bức tranh
张画=một bức tranh
帧画面=một khung hình
幅画面=một khung cảnh
个画面=một khung hình
份报告=một bản báo cáo
篇报告=một bài báo cáo
个报告=một bản báo cáo
份报纸=một tờ báo
张报纸=một tờ báo
项研究=một công trình nghiên cứu
个研究=một nghiên cứu
项任务=một nhiệm vụ
个任务=một nhiệm vụ
份工作=một công việc
项工作=một hạng mục công việc
个工作=một công việc
则寓言=một mẩu truyện ngụ ngôn
个寓言=một truyện ngụ ngôn
篇寓言=một bài truyện ngụ ngôn
个故事=một câu chuyện
则故事=một mẩu chuyện
段故事=một đoạn câu chuyện
条新闻=một mẩu tin
则新闻=một mẩu tin
条消息=một tin nhắn / mẩu tin
个消息=một tin tức
则消息=một mẩu tin
条规定=một điều quy định
项规定=một hạng mục quy định
个节目=một chương trình
期节目=một số (kỳ) chương trình
台节目=một chương trình biểu diễn
组数据=một tập dữ liệu
项数据=một mục dữ liệu
道题=một câu hỏi / bài tập
个题=một câu hỏi
段时间=một khoảng thời gian
件事情=một việc
桩事情=một chuyện
个事情=một việc
场比赛=một trận thi đấu
轮比赛=một vòng thi đấu
局比赛=một ván đấu
个比赛=một cuộc thi đấu
届奥运会=một kỳ Thế vận hội
场考试=một kỳ thi
场演出=một buổi biểu diễn
台演出=một buổi biểu diễn
通电话=một cuộc điện thoại
个电话=một cuộc điện thoại
部电话=một chiếc điện thoại
笔钱=một khoản tiền
块钱=một đồng (tệ)
笔生意=một phi vụ làm ăn
桩生意=một vụ làm ăn
宗生意=một vụ làm ăn
起案件=một vụ án
宗案件=một vụ án
桩案件=một vụ án
个案件=một vụ án
起事故=một vụ tai nạn
场事故=một vụ tai nạn
例病例=một ca bệnh
个病例=một ca bệnh
盘棋=một ván cờ
局棋=một ván cờ
副棋=một bộ cờ
副扑克=một bộ bài tây
阵风=một cơn gió
股风=một luồng gió
缕风=một làn gió
场雨=một trận mưa
阵雨=một cơn mưa rào
滴雨=một giọt mưa
场雪=một trận tuyết
阵掌声=một tràng vỗ tay
道闪电=một tia chớp
道彩虹=một dải cầu vồng
颗星星=một ngôi sao
颗心=một trái tim
滴眼泪=một giọt nước mắt
轮月亮=một vầng trăng
弯月亮=một vầng trăng khuyết
个月亮=một mặt trăng
轮太阳=một vầng mặt trời
个太阳=một mặt trời
轮明月=một vầng trăng sáng
弯新月=một vầng trăng non
缕阳光=một tia nắng
束阳光=một chùm ánh nắng
道阳光=một tia nắng
丝阳光=một chút ánh nắng
片阳光=một vùng nắng
缕烟=một làn khói
股烟=một luồng khói
丝烟=một sợi khói mỏng
丝凉意=một chút hơi mát
股凉意=một luồng hơi mát
股暖流=một dòng ấm áp
股香味=một luồng hương thơm
丝香味=một chút hương thơm
阵香味=một làn hương thơm
泓清泉=một dòng suối trong
股清泉=một dòng suối trong
泓湖水=một hồ nước trong
片湖水=một vùng nước hồ
滩泥=một vũng bùn
块泥=một cục bùn
捆柴=một bó củi
根柴=một thanh củi
把柴=một nắm củi
挂鞭炮=một tràng pháo
串鞭炮=một chuỗi pháo
个名字=một cái tên
个问题=một câu hỏi / vấn đề
道问题=một câu hỏi
个同学=một bạn học
位同学=một bạn học (lịch sự)
名同学=một bạn học
群同学=một nhóm bạn học
个男人=một người đàn ông
群男人=một nhóm đàn ông
个女人=một người phụ nữ
群女人=một nhóm phụ nữ
只熊猫=một con gấu trúc
群熊猫=một đàn gấu trúc
片草=một bãi cỏ
根草=một ngọn cỏ
辆出租车=một chiếc taxi
部出租车=một chiếc taxi
辆公共汽车=một chiếc xe buýt
部公共汽车=một chiếc xe buýt
份菜单=một tờ thực đơn
张菜单=một tờ thực đơn
个菜单=một thực đơn
家宾馆=một khách sạn
个宾馆=một khách sạn
座宾馆=một toà khách sạn
家银行=một ngân hàng
个银行=một ngân hàng
家超市=một siêu thị
个超市=một siêu thị
个机场=một sân bay
座机场=một sân bay
间教室=một phòng học
个教室=một phòng học
部电梯=một chiếc thang máy
台电梯=một chiếc thang máy
个电梯=một cái thang máy
台空调=một chiếc điều hoà
个空调=một cái điều hoà
台照相机=một chiếc máy ảnh
部照相机=một chiếc máy ảnh
个照相机=một cái máy ảnh
块黑板=một tấm bảng đen
个黑板=một cái bảng đen
份作业=một bài tập về nhà
道作业=một bài tập
件衬衫=một chiếc áo sơ mi
个西瓜=một quả dưa hấu
块西瓜=một miếng dưa hấu
片西瓜=một miếng dưa hấu (lát mỏng)
个鸡蛋=một quả trứng gà
盒鸡蛋=một hộp trứng gà
块羊肉=một miếng thịt cừu
片羊肉=một lát thịt cừu
盘水果=một đĩa hoa quả
箱水果=một thùng hoa quả
袋水果=một túi hoa quả
份水果=một phần hoa quả
个包=một cái túi
只包=một chiếc túi
个行李箱=một cái va-li
只行李箱=một chiếc va-li
本护照=một quyển hộ chiếu
本字典=một quyển từ điển
部字典=một bộ từ điển
杯果汁=một cốc nước ép
瓶果汁=một chai nước ép
盒果汁=một hộp nước ép
罐果汁=một lon nước ép
座城市=một thành phố
个城市=một thành phố
个国家=một quốc gia
个公园=một công viên
座公园=một công viên
条街道=một con phố
个节日=một ngày lễ
个办法=một cách / biện pháp
个词语=một từ ngữ
组词语=một nhóm từ ngữ
个花园=một vườn hoa
座花园=một khu vườn hoa
个声音=một âm thanh
阵声音=một tràng âm thanh
条腿=một cái chân
双腿=một đôi chân
只腿=một bên chân
只脚=một bàn chân
双脚=một đôi bàn chân
个杯子=một cái cốc
只杯子=một chiếc cốc
个盘子=một cái đĩa
只盘子=một chiếc đĩa
句汉语=một câu tiếng Hán
`.trim().split('\n').map(line => line.split('=')));
