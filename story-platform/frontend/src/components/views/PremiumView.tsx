import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check, AlertCircle, Headphones, LifeBuoy, X, Loader2, RefreshCw, Crown, Calendar, Percent, ChevronDown, Send } from 'lucide-react';
import { PremiumPlan, SubscriptionPlanId } from '../../types';
import { subscriptionRepository } from '../../services/repositories/SubscriptionRepository';
import { premiumRepository } from '../../services/repositories/PremiumRepository';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { Portal } from '../common/filter/Portal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { PaymentQrCode } from '../common/PaymentQrCode';

const PLANS: PremiumPlan[] = [
  {
    code: 'PREMIUM_MONTHLY',
    name: 'Premium Tháng',
    priceVnd: 59000,
    durationDays: 30,
  },
  {
    code: 'PREMIUM_QUARTERLY',
    name: 'Premium 3 Tháng',
    priceVnd: 150000,
    durationDays: 90,
    originalPriceVnd: 177000,
    savingsVnd: 27000,
  },
  {
    code: 'PREMIUM_SEMIANNUAL',
    name: 'Premium 6 Tháng',
    priceVnd: 270000,
    durationDays: 180,
    originalPriceVnd: 354000,
    savingsVnd: 84000,
    isPopular: true,
  },
  {
    code: 'PREMIUM_ANNUAL',
    name: 'Premium 12 Tháng',
    priceVnd: 480000,
    durationDays: 365,
    originalPriceVnd: 708000,
    savingsVnd: 228000,
    isBestDeal: true,
  },
];

const PRIVILEGES = [
  'Không quảng cáo thương mại.',
  'Âm thanh tối đa 320 kbps, tùy nguồn audio.',
  'Nghe toàn bộ nội dung thuộc danh mục TOP TRUYỆN AUDIO Premium.',
  'Nghe sớm một số tập được Creator/nền tảng cho phép.',
  'Tạo danh sách phát cá nhân không giới hạn.',
  'Huy hiệu Premium trong hồ sơ và khu vực đánh giá.',
  'Tiếp nhận yêu cầu hỗ trợ 24/7.',
  'Đồng bộ lịch sử, tiến độ và danh sách phát sau khi có backend.',
  'Ít banner quảng bá hơn.',
  'Quyền truy cập các tính năng Premium mới khi được phát triển.',
];

export const PremiumView: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const faqs = [
    {
      id: '1',
      question: 'Làm thế nào để đăng ký gói Premium?',
      answer: 'Bạn có thể đăng ký gói Premium bằng cách chọn gói phù hợp trong trang này và thanh toán qua cổng PayOS hoặc VietQR. Sau khi thanh toán thành công, tài khoản của bạn sẽ được nâng cấp ngay lập tức.',
    },
    {
      id: '2',
      question: 'Gói Premium có những quyền lợi gì?',
      answer: 'Gói Premium cho phép bạn nghe tất cả các truyện audio không giới hạn, truy cập nội dung độc quyền, tải về để nghe offline, không có quảng cáo, và hỗ trợ 24/7.',
    },
    {
      id: '3',
      question: 'Tôi có thể hủy đăng ký Premium bất cứ lúc nào không?',
      answer: 'Có, bạn có thể hủy đăng ký Premium bất cứ lúc nào. Sau khi hủy, bạn vẫn có thể sử dụng gói Premium cho đến hết kỳ đăng ký hiện tại.',
    },
    {
      id: '4',
      question: 'Phương thức thanh toán được hỗ trợ?',
      answer: 'Chúng tôi hỗ trợ thanh toán qua VietQR, thẻ tín dụng/thẻ ghi nợ, và ví điện tử qua cổng PayOS. Tất cả giao dịch đều được bảo mật và an toàn.',
    },
  ];

  useBodyScrollLock(isModalOpen);

  // Fetch user subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await premiumRepository.getUserSubscription();
        if (response.success && response.data) {
          setUserSubscription(response.data);
          setAutoRenew(response.data.autoRenew || false);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };
    fetchSubscription();
  }, [isSuccess]);

  const applyPaidMembership = useCallback(async () => {
    setPaymentStatus('PAID');
    try {
      await refreshUser();
    } catch (error) {
      console.error('Refresh user after payment failed:', error);
      if (selectedPlan) {
        await updateUser({
          membership: {
            tier: 'PREMIUM',
            subscriptionStatus: 'ACTIVE',
            planId: selectedPlan.code as SubscriptionPlanId,
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000 * selectedPlan.durationDays).toISOString(),
          },
        });
      }
    }

    setTimeout(() => {
      setIsModalOpen(false);
    }, 2000);
  }, [selectedPlan, updateUser, refreshUser]);

  useEffect(() => {
    const orderCode = paymentResponse?.orderCode;
    if (!isModalOpen || !orderCode || paymentStatus === 'PAID') {
      return;
    }

    let cancelled = false;
    const POLL_INTERVAL_MS = 8000;

    const checkStatus = async () => {
      if (cancelled) return;

      try {
        setCheckingStatus(true);
        const response = await premiumRepository.checkPaymentStatus(orderCode);
        if (cancelled || !response.success) return;

        setPaymentStatus(response.data.status);

        if (response.data.status === 'PAID') {
          await applyPaidMembership();
        }
      } catch (error) {
        console.error('Payment status check error:', error);
      } finally {
        if (!cancelled) {
          setCheckingStatus(false);
        }
      }
    };

    const initialCheck = setTimeout(checkStatus, 2000);
    const interval = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [isModalOpen, paymentResponse?.orderCode, paymentStatus, applyPaidMembership]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const handleSelectPlan = (plan: PremiumPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
    setIsSuccess(false);
    setPaymentResponse(null);
    setPaymentStatus('PENDING');
  };

  const handleCreatePayment = async () => {
    if (!selectedPlan || !user) return;

    setPaymentLoading(true);
    try {
      const response = await premiumRepository.createPayment(selectedPlan.code, autoRenew);
      if (response.success) {
        setPaymentResponse(response.data);
        setPaymentStatus('PENDING');
        setIsSuccess(true);
      } else {
        alert(response.message || 'Không thể tạo thanh toán. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      const errorCode = error?.code;
      const errorMessage = error?.message;
      if (errorCode === 'PAYOS_NOT_CONFIGURED' || errorCode === 'PAYOS_TOKEN_NOT_CONFIGURED') {
        alert('Hệ thống thanh toán chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
      } else if (errorCode === 'PAYOS_TOKEN_INVALID') {
        alert('Token thanh toán đã hết hạn. Admin cần cập nhật Gateway Token mới.');
      } else {
        alert(errorMessage || 'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      const response = await premiumRepository.updateAutoRenew(!autoRenew);
      if (response.success) {
        setAutoRenew(!autoRenew);
        alert(response.message);
      }
    } catch (error) {
      console.error('Failed to update auto-renewal:', error);
      alert('Không thể cập nhật tự động gia hạn. Vui lòng thử lại.');
    }
  };

  const handleRetryStatusCheck = async () => {
    if (!paymentResponse) return;

    setCheckingStatus(true);
    try {
      const response = await premiumRepository.checkPaymentStatus(paymentResponse.orderCode);
      if (response.success) {
        setPaymentStatus(response.data.status);

        if (response.data.status === 'PAID') {
          await applyPaidMembership();
        }
      }
    } catch (error) {
      console.error('Payment status check error:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      alert('Đã gửi yêu cầu hỗ trợ thành công!');
      setShowSupportForm(false);
      setSelectedQuestion('');
      setSupportMessage('');
      setSupportEmail('');
    } catch (error) {
      alert('Lỗi khi gửi yêu cầu hỗ trợ. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <style>{`
        .premium-container {
          height: 100%;
          width: 100%;
          background: radial-gradient(ellipse at bottom, #321b35 0%, #090a0f 100%);
          overflow: hidden;
          position: relative;
        }
        #stars {
          width: 1px;
          height: 1px;
          background: transparent;
          box-shadow:
            501px 811px #fff, 1450px 1324px #fff, 1093px 1780px #fff, 1469px 678px #fff, 904px 741px #fff, 1160px 781px #fff, 1841px 1962px #fff, 1630px 1667px #fff, 1788px 676px #fff, 367px 1734px #fff, 1343px 156px #fff, 1283px 1142px #fff, 1062px 378px #fff, 1395px 467px #fff, 1017px 1891px #fff, 137px 1114px #fff, 1767px 1403px #fff, 1543px 11px #fff, 1078px 181px #fff, 1189px 1574px #fff, 1697px 1551px #fff, 439px 472px #fff, 1491px 677px #fff, 1364px 599px #fff, 34px 382px #fff, 1221px 1584px #fff, 1266px 1499px #fff, 169px 1907px #fff, 1219px 1125px #fff, 659px 18px #fff, 1731px 1959px #fff, 332px 1216px #fff, 1913px 788px #fff, 80px 712px #fff, 326px 1605px #fff, 574px 1502px #fff, 473px 1653px #fff, 404px 975px #fff, 322px 1797px #fff, 425px 1321px #fff, 1121px 1797px #fff, 731px 647px #fff, 891px 1584px #fff, 1523px 109px #fff, 1379px 244px #fff, 865px 1064px #fff, 493px 956px #fff, 624px 1380px #fff, 440px 619px #fff, 1630px 767px #fff, 955px 1196px #fff, 62px 729px #fff, 126px 946px #fff, 1256px 896px #fff, 1444px 256px #fff, 661px 1628px #fff, 1078px 1716px #fff, 300px 737px #fff, 1734px 413px #fff, 1296px 129px #fff, 1771px 1678px #fff, 977px 1764px #fff, 1879px 549px #fff, 665px 1531px #fff, 89px 701px #fff, 1084px 1183px #fff, 1597px 1576px #fff, 1354px 1774px #fff, 554px 1471px #fff, 1469px 287px #fff, 887px 106px #fff, 1962px 766px #fff, 638px 805px #fff, 1651px 741px #fff, 1517px 1826px #fff, 24px 1152px #fff, 507px 558px #fff, 1262px 652px #fff, 246px 1048px #fff, 1077px 421px #fff, 1866px 1847px #fff, 1986px 1561px #fff, 704px 632px #fff, 1991px 1875px #fff, 1227px 395px #fff, 45px 1116px #fff, 247px 786px #fff, 890px 607px #fff, 787px 1235px #fff, 557px 524px #fff, 1582px 1285px #fff, 1725px 1366px #fff, 952px 747px #fff, 251px 458px #fff, 1500px 1250px #fff, 1999px 1734px #fff, 1336px 1955px #fff, 1705px 1464px #fff, 728px 697px #fff, 594px 510px #fff, 1345px 1990px #fff, 1919px 1803px #fff, 1117px 966px #fff, 1629px 97px #fff, 1046px 1196px #fff, 810px 1092px #fff, 722px 976px #fff, 406px 18px #fff, 1665px 1860px #fff, 1758px 1628px #fff, 1183px 463px #fff, 564px 239px #fff, 13px 1767px #fff, 1482px 1472px #fff, 1700px 347px #fff, 1362px 244px #fff, 1141px 1708px #fff, 22px 885px #fff, 374px 1309px #fff, 1034px 1037px #fff, 1725px 1086px #fff, 1343px 1921px #fff, 596px 903px #fff, 1061px 478px #fff, 18px 1409px #fff, 729px 1364px #fff, 264px 911px #fff, 677px 1442px #fff, 123px 33px #fff, 1303px 646px #fff, 1945px 792px #fff, 1305px 938px #fff, 918px 1536px #fff, 620px 948px #fff, 183px 646px #fff, 695px 687px #fff, 881px 272px #fff, 1521px 1212px #fff, 1423px 1022px #fff, 1545px 1271px #fff, 1393px 348px #fff, 685px 1910px #fff, 1446px 856px #fff, 73px 1201px #fff, 736px 999px #fff, 673px 796px #fff, 469px 850px #fff, 1912px 142px #fff, 1278px 664px #fff, 184px 1990px #fff, 1173px 1312px #fff, 782px 1879px #fff, 323px 1035px #fff, 611px 908px #fff, 565px 1449px #fff, 748px 1713px #fff, 1047px 490px #fff, 1040px 1872px #fff, 1818px 1659px #fff, 1806px 1327px #fff, 386px 575px #fff, 1550px 463px #fff, 148px 687px #fff, 651px 1683px #fff, 1588px 1194px #fff, 1831px 2px #fff, 581px 876px #fff, 1396px 1743px #fff, 1212px 1810px #fff, 421px 1920px #fff, 658px 1461px #fff, 1859px 1809px #fff, 1456px 388px #fff, 186px 1627px #fff, 1528px 1145px #fff, 171px 97px #fff, 674px 1072px #fff, 676px 1052px #fff, 1165px 1131px #fff, 1088px 781px #fff, 1231px 948px #fff, 330px 257px #fff, 426px 1046px #fff, 549px 652px #fff, 1338px 74px #fff, 1749px 364px #fff, 931px 369px #fff, 383px 1428px #fff, 1558px 389px #fff, 927px 133px #fff, 234px 1888px #fff, 1785px 1617px #fff, 556px 643px #fff, 401px 275px #fff, 406px 1644px #fff, 1253px 1852px #fff, 1599px 883px #fff, 744px 1721px #fff, 524px 1297px #fff, 1226px 1177px #fff, 1679px 55px #fff, 874px 1811px #fff, 838px 790px #fff, 1241px 430px #fff, 1676px 652px #fff, 1191px 568px #fff, 53px 1990px #fff, 1163px 237px #fff, 61px 223px #fff, 592px 456px #fff, 1844px 271px #fff, 1324px 1488px #fff, 1373px 717px #fff, 1822px 709px #fff, 1464px 941px #fff, 1445px 1118px #fff, 991px 1414px #fff, 1964px 1076px #fff, 108px 172px #fff, 641px 1722px #fff, 1539px 427px #fff, 1697px 45px #fff, 1301px 1353px #fff, 1060px 329px #fff, 967px 1396px #fff, 493px 301px #fff, 1228px 1406px #fff, 1211px 1653px #fff, 444px 1822px #fff, 1746px 353px #fff, 1449px 381px #fff, 671px 887px #fff, 650px 138px #fff, 30px 1839px #fff, 1094px 1405px #fff, 273px 796px #fff, 1618px 1964px #fff, 1045px 1849px #fff, 1472px 1155px #fff, 1529px 1312px #fff, 728px 448px #fff, 44px 1908px #fff, 691px 818px #fff, 254px 293px #fff, 1981px 1133px #fff, 1307px 375px #fff, 196px 316px #fff, 1241px 1975px #fff, 1138px 1706px #fff, 1769px 463px #fff, 1768px 1428px #fff, 1730px 590px #fff, 1780px 523px #fff, 1862px 1526px #fff, 1613px 909px #fff, 1266px 1781px #fff, 470px 352px #fff, 699px 1682px #fff, 1002px 614px #fff, 1209px 133px #fff, 1842px 518px #fff, 1422px 1836px #fff, 1720px 1901px #fff, 470px 1788px #fff, 1355px 1387px #fff, 146px 1162px #fff, 933px 80px #fff, 681px 1063px #fff, 313px 1341px #fff, 740px 1498px #fff, 168px 1014px #fff, 345px 1355px #fff, 1498px 1562px #fff, 1626px 1358px #fff, 890px 403px #fff, 663px 562px #fff, 1481px 168px #fff, 22px 719px #fff, 774px 1041px #fff, 1899px 829px #fff, 430px 158px #fff, 430px 361px #fff, 1592px 1334px #fff, 224px 323px #fff, 1639px 1131px #fff, 7px 271px #fff, 1646px 1514px #fff, 1605px 1444px #fff, 1820px 1665px #fff, 1549px 1641px #fff, 1609px 1377px #fff, 486px 1098px #fff, 229px 613px #fff, 542px 1694px #fff, 318px 256px #fff, 1861px 918px #fff, 889px 892px #fff, 442px 1524px #fff, 19px 422px #fff, 1935px 1908px #fff, 828px 109px #fff, 862px 1248px #fff, 1275px 560px #fff, 906px 63px #fff, 337px 1605px #fff, 1691px 918px #fff, 1414px 679px #fff, 1726px 749px #fff, 1540px 1149px #fff, 1337px 1466px #fff, 446px 430px #fff, 676px 1616px #fff, 840px 326px #fff, 976px 977px #fff, 1840px 642px #fff, 1273px 804px #fff, 1071px 928px #fff, 1292px 1675px #fff, 29px 1148px #fff, 1585px 135px #fff, 1007px 563px #fff, 1035px 78px #fff, 1174px 574px #fff, 120px 1304px #fff, 845px 1292px #fff, 861px 540px #fff, 234px 232px #fff, 1940px 1367px #fff, 759px 639px #fff, 1775px 1381px #fff, 906px 372px #fff, 1104px 1165px #fff, 1524px 911px #fff, 1882px 330px #fff, 1389px 700px #fff, 300px 1629px #fff, 220px 1614px #fff, 563px 140px #fff, 1611px 1586px #fff, 793px 1316px #fff, 325px 1070px #fff, 1722px 1462px #fff, 1406px 1120px #fff, 1169px 1768px #fff, 1956px 1053px #fff, 959px 1587px #fff, 585px 1566px #fff, 370px 204px #fff, 1606px 1416px #fff, 443px 1606px #fff, 1499px 1102px #fff, 1943px 105px #fff, 1121px 1594px #fff, 1512px 32px #fff, 871px 1425px #fff, 433px 100px #fff, 294px 1471px #fff, 1688px 1755px #fff, 1666px 591px #fff, 1034px 300px #fff, 734px 1178px #fff, 1342px 313px #fff, 1616px 1590px #fff, 1763px 1472px #fff, 632px 1935px #fff, 1708px 872px #fff, 1871px 915px #fff, 1829px 1020px #fff, 1599px 578px #fff, 42px 585px #fff, 1163px 1382px #fff, 1744px 1272px #fff, 984px 1426px #fff, 1786px 1584px #fff, 1813px 379px #fff, 1867px 1127px #fff, 97px 567px #fff, 626px 988px #fff, 1178px 79px #fff, 1703px 211px #fff, 961px 1785px #fff, 110px 975px #fff, 953px 1941px #fff, 1027px 1790px #fff, 1665px 107px #fff, 11px 964px #fff, 1718px 1147px #fff, 21px 1728px #fff, 1358px 1922px #fff, 872px 65px #fff, 1191px 1635px #fff, 762px 681px #fff, 1519px 1033px #fff, 906px 566px #fff, 1074px 657px #fff, 1093px 415px #fff, 51px 198px #fff, 1075px 1418px #fff, 1547px 1070px #fff, 225px 920px #fff, 850px 1974px #fff, 981px 595px #fff, 1425px 131px #fff, 460px 917px #fff, 56px 495px #fff, 714px 428px #fff, 920px 493px #fff, 470px 1521px #fff, 532px 821px #fff, 1905px 71px #fff, 883px 1501px #fff, 294px 196px #fff, 381px 1999px #fff, 332px 793px #fff, 1246px 408px #fff, 233px 149px #fff, 315px 231px #fff, 1594px 1302px #fff, 696px 1585px #fff, 791px 136px #fff, 479px 199px #fff, 1627px 1413px #fff, 1824px 924px #fff, 1631px 342px #fff, 1251px 1151px #fff, 284px 1781px #fff, 497px 1052px #fff, 204px 1161px #fff, 646px 1499px #fff, 1762px 558px #fff, 854px 1833px #fff, 883px 945px #fff, 44px 982px #fff, 1101px 834px #fff, 515px 1748px #fff, 1578px 1435px #fff, 819px 1258px #fff, 776px 670px #fff, 115px 385px #fff, 1478px 434px #fff, 885px 20px #fff, 192px 1513px #fff, 78px 1129px #fff, 1774px 1105px #fff, 955px 1149px #fff, 1817px 1929px #fff, 1106px 1832px #fff, 1107px 1997px #fff, 94px 23px #fff, 243px 982px #fff, 43px 1972px #fff, 1798px 673px #fff, 1131px 1589px #fff, 841px 14px #fff, 826px 345px #fff, 687px 56px #fff, 1084px 32px #fff, 1887px 1878px #fff, 153px 526px #fff, 1828px 253px #fff, 1947px 1105px #fff, 886px 700px #fff, 1307px 1723px #fff, 1274px 651px #fff, 1530px 837px #fff, 1699px 1637px #fff, 1703px 1331px #fff, 1929px 1557px #fff, 1763px 737px #fff, 1118px 1680px #fff, 1545px 692px #fff, 1462px 1092px #fff, 208px 1667px #fff, 1393px 859px #fff, 186px 1794px #fff, 351px 1199px #fff, 642px 1995px #fff, 1061px 1726px #fff, 1708px 115px #fff, 1233px 1305px #fff, 637px 1786px #fff, 1730px 603px #fff, 75px 1240px #fff, 1704px 1326px #fff, 584px 346px #fff, 438px 1554px #fff, 561px 513px #fff, 1382px 225px #fff, 467px 1674px #fff, 1403px 815px #fff, 1546px 1835px #fff, 127px 1119px #fff, 276px 591px #fff, 688px 1458px #fff, 765px 646px #fff, 474px 984px #fff, 171px 361px #fff, 94px 1480px #fff, 1962px 1666px #fff, 909px 1037px #fff, 1725px 222px #fff, 253px 1355px #fff, 1892px 1901px #fff, 275px 1847px #fff, 28px 1184px #fff, 1725px 1382px #fff, 882px 647px #fff, 1935px 1046px #fff, 10px 344px #fff, 292px 1328px #fff, 127px 1352px #fff, 752px 929px #fff, 1589px 384px #fff, 284px 1829px #fff, 381px 820px #fff, 1229px 1125px #fff, 777px 429px #fff, 1811px 1499px #fff, 1573px 287px #fff, 295px 756px #fff, 389px 616px #fff, 781px 41px #fff, 1092px 333px #fff, 794px 1588px #fff, 386px 1847px #fff, 1802px 710px #fff, 662px 60px #fff, 640px 264px #fff, 463px 746px #fff, 1859px 799px #fff, 763px 37px #fff, 639px 396px #fff, 357px 1071px #fff, 1190px 1430px #fff, 1814px 257px #fff, 1382px 235px #fff, 606px 1304px #fff, 1939px 1470px #fff, 1124px 349px #fff, 307px 1567px #fff, 310px 1323px #fff, 1145px 922px #fff, 1196px 1922px #fff, 1647px 544px #fff, 788px 1337px #fff, 257px 632px #fff, 1413px 414px #fff, 590px 620px #fff, 582px 794px #fff, 1702px 1481px #fff, 1055px 53px #fff, 157px 346px #fff, 50px 1901px #fff, 1038px 1369px #fff, 796px 1941px #fff, 215px 194px #fff, 1567px 1538px #fff, 367px 800px #fff, 1044px 489px #fff, 1109px 1712px #fff, 524px 327px #fff, 525px 1252px #fff, 1475px 1240px #fff, 529px 436px #fff, 795px 834px #fff, 122px 1371px #fff, 79px 482px #fff, 520px 1249px #fff, 336px 1878px #fff, 188px 944px #fff, 325px 1259px #fff, 1491px 1942px #fff, 620px 1054px #fff, 1606px 1153px #fff, 1448px 502px #fff, 53px 1381px #fff, 107px 1670px #fff, 1380px 618px #fff, 967px 1557px #fff, 1116px 1722px #fff, 1174px 1044px #fff, 1805px 717px #fff, 663px 394px #fff, 1848px 1007px #fff, 389px 802px #fff, 49px 392px #fff, 1650px 852px #fff, 1678px 1012px #fff, 335px 1009px #fff, 1818px 1631px #fff, 1568px 742px #fff, 1162px 1991px #fff, 52px 1190px #fff, 1401px 928px #fff, 119px 1549px #fff, 537px 1529px #fff, 2px 1709px #fff, 122px 387px #fff, 543px 2px #fff, 27px 1971px #fff, 507px 1377px #fff, 1362px 1080px #fff, 1031px 1544px #fff, 1631px 1174px #fff, 1603px 312px #fff, 1626px 1422px #fff, 1430px 615px #fff, 1958px 1431px #fff, 1946px 1412px #fff, 1848px 247px #fff, 984px 1808px #fff, 1396px 225px #fff, 319px 717px #fff, 1252px 875px #fff, 1619px 156px #fff, 951px 1971px #fff, 386px 355px #fff, 1406px 1151px #fff, 273px 1538px #fff, 844px 1570px #fff, 947px 151px #fff, 1363px 525px #fff, 209px 307px #fff, 1923px 1718px #fff, 993px 1741px #fff, 1513px 353px #fff, 1353px 61px #fff, 664px 352px #fff, 1382px 359px #fff, 1487px 1707px #fff, 657px 1045px #fff, 1107px 490px #fff, 1834px 1176px #fff, 837px 1438px #fff, 1947px 448px #fff, 1196px 333px #fff, 151px 555px #fff, 18px 992px #fff, 458px 748px #fff, 1801px 890px #fff, 1093px 1012px #fff, 315px 1101px #fff, 194px 323px #fff, 754px 292px #fff, 1737px 7px #fff, 40px 840px #fff, 1170px 805px #fff, 176px 1753px #fff, 805px 1148px #fff, 1578px 1271px #fff, 367px 1494px #fff, 363px 1111px #fff, 1955px 243px #fff, 1451px 1093px #fff, 375px 617px #fff, 1223px 720px #fff, 1178px 13px #fff, 1456px 865px #fff, 1440px 49px #fff, 186px 1569px #fff, 320px 1853px #fff, 300px 539px #fff, 1559px 509px #fff, 1985px 1108px #fff, 1588px 828px #fff, 525px 1432px #fff, 831px 363px #fff, 141px 281px #fff, 1319px 402px #fff, 40px 456px #fff, 1955px 478px #fff, 1758px 818px #fff, 1924px 688px #fff, 1030px 953px #fff, 1982px 210px #fff, 917px 1401px #fff, 1051px 1837px #fff, 1045px 463px #fff, 1744px 573px #fff, 529px 1530px #fff, 542px 469px #fff, 1982px 324px #fff, 1902px 1422px #fff, 1968px 782px #fff, 1666px 1561px #fff, 955px 304px #fff, 323px 778px #fff, 272px 443px #fff, 485px 581px #fff, 1353px 1058px #fff, 1257px 131px #fff, 434px 98px #fff, 1587px 1953px #fff, 1749px 68px #fff, 1984px 839px #fff, 1518px 183px #fff, 1071px 855px #fff, 1662px 1994px #fff, 1111px 106px #fff, 1954px 838px #fff;
          animation: animStar 50s linear infinite;
        }
        #stars:after {
          content: " ";
          position: absolute;
          top: 2000px;
          width: 1px;
          height: 1px;
          background: transparent;
          box-shadow:
            501px 811px #fff, 1450px 1324px #fff, 1093px 1780px #fff, 1469px 678px #fff, 904px 741px #fff, 1160px 781px #fff, 1841px 1962px #fff, 1630px 1667px #fff, 1788px 676px #fff, 367px 1734px #fff, 1343px 156px #fff, 1283px 1142px #fff, 1062px 378px #fff, 1395px 467px #fff, 1017px 1891px #fff, 137px 1114px #fff, 1767px 1403px #fff, 1543px 11px #fff, 1078px 181px #fff, 1189px 1574px #fff, 1697px 1551px #fff, 439px 472px #fff, 1491px 677px #fff, 1364px 599px #fff, 34px 382px #fff, 1221px 1584px #fff, 1266px 1499px #fff, 169px 1907px #fff, 1219px 1125px #fff, 659px 18px #fff, 1731px 1959px #fff, 332px 1216px #fff, 1913px 788px #fff, 80px 712px #fff, 326px 1605px #fff, 574px 1502px #fff, 473px 1653px #fff, 404px 975px #fff, 322px 1797px #fff, 425px 1321px #fff, 1121px 1797px #fff, 731px 647px #fff, 891px 1584px #fff, 1523px 109px #fff, 1379px 244px #fff, 865px 1064px #fff, 493px 956px #fff, 624px 1380px #fff, 440px 619px #fff, 1630px 767px #fff, 955px 1196px #fff, 62px 729px #fff, 126px 946px #fff, 1256px 896px #fff, 1444px 256px #fff, 661px 1628px #fff, 1078px 1716px #fff, 300px 737px #fff, 1734px 413px #fff, 1296px 129px #fff, 1771px 1678px #fff, 977px 1764px #fff, 1879px 549px #fff, 665px 1531px #fff, 89px 701px #fff, 1084px 1183px #fff, 1597px 1576px #fff, 1354px 1774px #fff, 554px 1471px #fff, 1469px 287px #fff, 887px 106px #fff, 1962px 766px #fff, 638px 805px #fff, 1651px 741px #fff, 1517px 1826px #fff, 24px 1152px #fff, 507px 558px #fff, 1262px 652px #fff, 246px 1048px #fff, 1077px 421px #fff, 1866px 1847px #fff, 1986px 1561px #fff, 704px 632px #fff, 1991px 1875px #fff, 1227px 395px #fff, 45px 1116px #fff, 247px 786px #fff, 890px 607px #fff, 787px 1235px #fff, 557px 524px #fff, 1582px 1285px #fff, 1725px 1366px #fff, 952px 747px #fff, 251px 458px #fff, 1500px 1250px #fff, 1999px 1734px #fff, 1336px 1955px #fff, 1705px 1464px #fff, 728px 697px #fff, 594px 510px #fff, 1345px 1990px #fff, 1919px 1803px #fff, 1117px 966px #fff, 1629px 97px #fff, 1046px 1196px #fff, 810px 1092px #fff, 722px 976px #fff, 406px 18px #fff, 1665px 1860px #fff, 1758px 1628px #fff, 1183px 463px #fff, 564px 239px #fff, 13px 1767px #fff, 1482px 1472px #fff, 1700px 347px #fff, 1362px 244px #fff, 1141px 1708px #fff, 22px 885px #fff, 374px 1309px #fff, 1034px 1037px #fff, 1725px 1086px #fff, 1343px 1921px #fff, 596px 903px #fff, 1061px 478px #fff, 18px 1409px #fff, 729px 1364px #fff, 264px 911px #fff, 677px 1442px #fff, 123px 33px #fff, 1303px 646px #fff, 1945px 792px #fff, 1305px 938px #fff, 918px 1536px #fff, 620px 948px #fff, 183px 646px #fff, 695px 687px #fff, 881px 272px #fff, 1521px 1212px #fff, 1423px 1022px #fff, 1545px 1271px #fff, 1393px 348px #fff, 685px 1910px #fff, 1446px 856px #fff, 73px 1201px #fff, 736px 999px #fff, 673px 796px #fff, 469px 850px #fff, 1912px 142px #fff, 1278px 664px #fff, 184px 1990px #fff, 1173px 1312px #fff, 782px 1879px #fff, 323px 1035px #fff, 611px 908px #fff, 565px 1449px #fff, 748px 1713px #fff, 1047px 490px #fff, 1040px 1872px #fff, 1818px 1659px #fff, 1806px 1327px #fff, 386px 575px #fff, 1550px 463px #fff, 148px 687px #fff, 651px 1683px #fff, 1588px 1194px #fff, 1831px 2px #fff, 581px 876px #fff, 1396px 1743px #fff, 1212px 1810px #fff, 421px 1920px #fff, 658px 1461px #fff, 1859px 1809px #fff, 1456px 388px #fff, 186px 1627px #fff, 1528px 1145px #fff, 171px 97px #fff, 674px 1072px #fff, 676px 1052px #fff, 1165px 1131px #fff, 1088px 781px #fff, 1231px 948px #fff, 330px 257px #fff, 426px 1046px #fff, 549px 652px #fff, 1338px 74px #fff, 1749px 364px #fff, 931px 369px #fff, 383px 1428px #fff, 1558px 389px #fff, 927px 133px #fff, 234px 1888px #fff, 1785px 1617px #fff, 556px 643px #fff, 401px 275px #fff, 406px 1644px #fff, 1253px 1852px #fff, 1599px 883px #fff, 744px 1721px #fff, 524px 1297px #fff, 1226px 1177px #fff, 1679px 55px #fff, 874px 1811px #fff, 838px 790px #fff, 1241px 430px #fff, 1676px 652px #fff, 1191px 568px #fff, 53px 1990px #fff, 1163px 237px #fff, 61px 223px #fff, 592px 456px #fff, 1844px 271px #fff, 1324px 1488px #fff, 1373px 717px #fff, 1822px 709px #fff, 1464px 941px #fff, 1445px 1118px #fff, 991px 1414px #fff, 1964px 1076px #fff, 108px 172px #fff, 641px 1722px #fff, 1539px 427px #fff, 1697px 45px #fff, 1301px 1353px #fff, 1060px 329px #fff, 967px 1396px #fff, 493px 301px #fff, 1228px 1406px #fff, 1211px 1653px #fff, 444px 1822px #fff, 1746px 353px #fff, 1449px 381px #fff, 671px 887px #fff, 650px 138px #fff, 30px 1839px #fff, 1094px 1405px #fff, 273px 796px #fff, 1618px 1964px #fff, 1045px 1849px #fff, 1472px 1155px #fff, 1529px 1312px #fff, 728px 448px #fff, 44px 1908px #fff, 691px 818px #fff, 254px 293px #fff, 1981px 1133px #fff, 1307px 375px #fff, 196px 316px #fff, 1241px 1975px #fff, 1138px 1706px #fff, 1769px 463px #fff, 1768px 1428px #fff, 1730px 590px #fff, 1780px 523px #fff, 1862px 1526px #fff, 1613px 909px #fff, 1266px 1781px #fff, 470px 352px #fff, 699px 1682px #fff, 1002px 614px #fff, 1209px 133px #fff, 1842px 518px #fff, 1422px 1836px #fff, 1720px 1901px #fff, 470px 1788px #fff, 1355px 1387px #fff, 146px 1162px #fff, 933px 80px #fff, 681px 1063px #fff, 313px 1341px #fff, 740px 1498px #fff, 168px 1014px #fff, 345px 1355px #fff, 1498px 1562px #fff, 1626px 1358px #fff, 890px 403px #fff, 663px 562px #fff, 1481px 168px #fff, 22px 719px #fff, 774px 1041px #fff, 1899px 829px #fff, 430px 158px #fff, 430px 361px #fff, 1592px 1334px #fff, 224px 323px #fff, 1639px 1131px #fff, 7px 271px #fff, 1646px 1514px #fff, 1605px 1444px #fff, 1820px 1665px #fff, 1549px 1641px #fff, 1609px 1377px #fff, 486px 1098px #fff, 229px 613px #fff, 542px 1694px #fff, 318px 256px #fff, 1861px 918px #fff, 889px 892px #fff, 442px 1524px #fff, 19px 422px #fff, 1935px 1908px #fff, 828px 109px #fff, 862px 1248px #fff, 1275px 560px #fff, 906px 63px #fff, 337px 1605px #fff, 1691px 918px #fff, 1414px 679px #fff, 1726px 749px #fff, 1540px 1149px #fff, 1337px 1466px #fff, 446px 430px #fff, 676px 1616px #fff, 840px 326px #fff, 976px 977px #fff, 1840px 642px #fff, 1273px 804px #fff, 1071px 928px #fff, 1292px 1675px #fff, 29px 1148px #fff, 1585px 135px #fff, 1007px 563px #fff, 1035px 78px #fff, 1174px 574px #fff, 120px 1304px #fff, 845px 1292px #fff, 861px 540px #fff, 234px 232px #fff, 1940px 1367px #fff, 759px 639px #fff, 1775px 1381px #fff, 906px 372px #fff, 1104px 1165px #fff, 1524px 911px #fff, 1882px 330px #fff, 1389px 700px #fff, 300px 1629px #fff, 220px 1614px #fff, 563px 140px #fff, 1611px 1586px #fff, 793px 1316px #fff, 325px 1070px #fff, 1722px 1462px #fff, 1406px 1120px #fff, 1169px 1768px #fff, 1956px 1053px #fff, 959px 1587px #fff, 585px 1566px #fff, 370px 204px #fff, 1606px 1416px #fff, 443px 1606px #fff, 1499px 1102px #fff, 1943px 105px #fff, 1121px 1594px #fff, 1512px 32px #fff, 871px 1425px #fff, 433px 100px #fff, 294px 1471px #fff, 1688px 1755px #fff, 1666px 591px #fff, 1034px 300px #fff, 734px 1178px #fff, 1342px 313px #fff, 1616px 1590px #fff, 1763px 1472px #fff, 632px 1935px #fff, 1708px 872px #fff, 1871px 915px #fff, 1829px 1020px #fff, 1599px 578px #fff, 42px 585px #fff, 1163px 1382px #fff, 1744px 1272px #fff, 984px 1426px #fff, 1786px 1584px #fff, 1813px 379px #fff, 1867px 1127px #fff, 97px 567px #fff, 626px 988px #fff, 1178px 79px #fff, 1703px 211px #fff, 961px 1785px #fff, 110px 975px #fff, 953px 1941px #fff, 1027px 1790px #fff, 1665px 107px #fff, 11px 964px #fff, 1718px 1147px #fff, 21px 1728px #fff, 1358px 1922px #fff, 872px 65px #fff, 1191px 1635px #fff, 762px 681px #fff, 1519px 1033px #fff, 906px 566px #fff, 1074px 657px #fff, 1093px 415px #fff, 51px 198px #fff, 1075px 1418px #fff, 1547px 1070px #fff, 225px 920px #fff, 850px 1974px #fff, 981px 595px #fff, 1425px 131px #fff, 460px 917px #fff, 56px 495px #fff, 714px 428px #fff, 920px 493px #fff, 470px 1521px #fff, 532px 821px #fff, 1905px 71px #fff, 883px 1501px #fff, 294px 196px #fff, 381px 1999px #fff, 332px 793px #fff, 1246px 408px #fff, 233px 149px #fff, 315px 231px #fff, 1594px 1302px #fff, 696px 1585px #fff, 791px 136px #fff, 479px 199px #fff, 1627px 1413px #fff, 1824px 924px #fff, 1631px 342px #fff, 1251px 1151px #fff, 284px 1781px #fff, 497px 1052px #fff, 204px 1161px #fff, 646px 1499px #fff, 1762px 558px #fff, 854px 1833px #fff, 883px 945px #fff, 44px 982px #fff, 1101px 834px #fff, 515px 1748px #fff, 1578px 1435px #fff, 819px 1258px #fff, 776px 670px #fff, 115px 385px #fff, 1478px 434px #fff, 885px 20px #fff, 192px 1513px #fff, 78px 1129px #fff, 1774px 1105px #fff, 955px 1149px #fff, 1817px 1929px #fff, 1106px 1832px #fff, 1107px 1997px #fff, 94px 23px #fff, 243px 982px #fff, 43px 1972px #fff, 1798px 673px #fff, 1131px 1589px #fff, 841px 14px #fff, 826px 345px #fff, 687px 56px #fff, 1084px 32px #fff, 1887px 1878px #fff, 153px 526px #fff, 1828px 253px #fff, 1947px 1105px #fff, 886px 700px #fff, 1307px 1723px #fff, 1274px 651px #fff, 1530px 837px #fff, 1699px 1637px #fff, 1703px 1331px #fff, 1929px 1557px #fff, 1763px 737px #fff, 1118px 1680px #fff, 1545px 692px #fff, 1462px 1092px #fff, 208px 1667px #fff, 1393px 859px #fff, 186px 1794px #fff, 351px 1199px #fff, 642px 1995px #fff, 1061px 1726px #fff, 1708px 115px #fff, 1233px 1305px #fff, 637px 1786px #fff, 1730px 603px #fff, 75px 1240px #fff, 1704px 1326px #fff, 584px 346px #fff, 438px 1554px #fff, 561px 513px #fff, 1382px 225px #fff, 467px 1674px #fff, 1403px 815px #fff, 1546px 1835px #fff, 127px 1119px #fff, 276px 591px #fff, 688px 1458px #fff, 765px 646px #fff, 474px 984px #fff, 171px 361px #fff, 94px 1480px #fff, 1962px 1666px #fff, 909px 1037px #fff, 1725px 222px #fff, 253px 1355px #fff, 1892px 1901px #fff, 275px 1847px #fff, 28px 1184px #fff, 1725px 1382px #fff, 882px 647px #fff, 1935px 1046px #fff, 10px 344px #fff, 292px 1328px #fff, 127px 1352px #fff, 752px 929px #fff, 1589px 384px #fff, 284px 1829px #fff, 381px 820px #fff, 1229px 1125px #fff, 777px 429px #fff, 1811px 1499px #fff, 1573px 287px #fff, 295px 756px #fff, 389px 616px #fff, 781px 41px #fff, 1092px 333px #fff, 794px 1588px #fff, 386px 1847px #fff, 1802px 710px #fff, 662px 60px #fff, 640px 264px #fff, 463px 746px #fff, 1859px 799px #fff, 763px 37px #fff, 639px 396px #fff, 357px 1071px #fff, 1190px 1430px #fff, 1814px 257px #fff, 1382px 235px #fff, 606px 1304px #fff, 1939px 1470px #fff, 1124px 349px #fff, 307px 1567px #fff, 310px 1323px #fff, 1145px 922px #fff, 1196px 1922px #fff, 1647px 544px #fff, 788px 1337px #fff, 257px 632px #fff, 1413px 414px #fff, 590px 620px #fff, 582px 794px #fff, 1702px 1481px #fff, 1055px 53px #fff, 157px 346px #fff, 50px 1901px #fff, 1038px 1369px #fff, 796px 1941px #fff, 215px 194px #fff, 1567px 1538px #fff, 367px 800px #fff, 1044px 489px #fff, 1109px 1712px #fff, 524px 327px #fff, 525px 1252px #fff, 1475px 1240px #fff, 529px 436px #fff, 795px 834px #fff, 122px 1371px #fff, 79px 482px #fff, 520px 1249px #fff, 336px 1878px #fff, 188px 944px #fff, 325px 1259px #fff, 1491px 1942px #fff, 620px 1054px #fff, 1606px 1153px #fff, 1448px 502px #fff, 53px 1381px #fff, 107px 1670px #fff, 1380px 618px #fff, 967px 1557px #fff, 1116px 1722px #fff, 1174px 1044px #fff, 1805px 717px #fff, 663px 394px #fff, 1848px 1007px #fff, 389px 802px #fff, 49px 392px #fff, 1650px 852px #fff, 1678px 1012px #fff, 335px 1009px #fff, 1818px 1631px #fff, 1568px 742px #fff, 1162px 1991px #fff, 52px 1190px #fff, 1401px 928px #fff, 119px 1549px #fff, 537px 1529px #fff, 2px 1709px #fff, 122px 387px #fff, 543px 2px #fff, 27px 1971px #fff, 507px 1377px #fff, 1362px 1080px #fff, 1031px 1544px #fff, 1631px 1174px #fff, 1603px 312px #fff, 1626px 1422px #fff, 1430px 615px #fff, 1958px 1431px #fff, 1946px 1412px #fff, 1848px 247px #fff, 984px 1808px #fff, 1396px 225px #fff, 319px 717px #fff, 1252px 875px #fff, 1619px 156px #fff, 951px 1971px #fff, 386px 355px #fff, 1406px 1151px #fff, 273px 1538px #fff, 844px 1570px #fff, 947px 151px #fff, 1363px 525px #fff, 209px 307px #fff, 1923px 1718px #fff, 993px 1741px #fff, 1513px 353px #fff, 1353px 61px #fff, 664px 352px #fff, 1382px 359px #fff, 1487px 1707px #fff, 657px 1045px #fff, 1107px 490px #fff, 1834px 1176px #fff, 837px 1438px #fff, 1947px 448px #fff, 1196px 333px #fff, 151px 555px #fff, 18px 992px #fff, 458px 748px #fff, 1801px 890px #fff, 1093px 1012px #fff, 315px 1101px #fff, 194px 323px #fff, 754px 292px #fff, 1737px 7px #fff, 40px 840px #fff, 1170px 805px #fff, 176px 1753px #fff, 805px 1148px #fff, 1578px 1271px #fff, 367px 1494px #fff, 363px 1111px #fff, 1955px 243px #fff, 1451px 1093px #fff, 375px 617px #fff, 1223px 720px #fff, 1178px 13px #fff, 1456px 865px #fff, 1440px 49px #fff, 186px 1569px #fff, 320px 1853px #fff, 300px 539px #fff, 1559px 509px #fff, 1985px 1108px #fff, 1588px 828px #fff, 525px 1432px #fff, 831px 363px #fff, 141px 281px #fff, 1319px 402px #fff, 40px 456px #fff, 1955px 478px #fff, 1758px 818px #fff, 1924px 688px #fff, 1030px 953px #fff, 1982px 210px #fff, 917px 1401px #fff, 1051px 1837px #fff, 1045px 463px #fff, 1744px 573px #fff, 529px 1530px #fff, 542px 469px #fff, 1982px 324px #fff, 1902px 1422px #fff, 1968px 782px #fff, 1666px 1561px #fff, 955px 304px #fff, 323px 778px #fff, 272px 443px #fff, 485px 581px #fff, 1353px 1058px #fff, 1257px 131px #fff, 434px 98px #fff, 1587px 1953px #fff, 1749px 68px #fff, 1984px 839px #fff, 1518px 183px #fff, 1071px 855px #fff, 1662px 1994px #fff, 1111px 106px #fff, 1954px 838px #fff;
        }
        #stars2 {
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow:
            1925px 1320px #fff, 693px 1778px #fff, 1016px 711px #fff, 1171px 563px #fff, 661px 1919px #fff, 1610px 44px #fff, 1275px 140px #fff, 1208px 1802px #fff, 1473px 1587px #fff, 11px 1117px #fff, 853px 1757px #fff, 1149px 937px #fff, 1353px 428px #fff, 270px 279px #fff, 258px 1404px #fff, 417px 1188px #fff, 286px 561px #fff, 393px 1765px #fff, 147px 881px #fff, 666px 1097px #fff, 1425px 1278px #fff, 806px 156px #fff, 1252px 561px #fff, 218px 52px #fff, 1371px 1980px #fff, 171px 745px #fff, 1424px 89px #fff, 137px 244px #fff, 939px 1922px #fff, 137px 1080px #fff, 1757px 50px #fff, 904px 536px #fff, 1938px 1001px #fff, 1172px 440px #fff, 72px 1475px #fff, 102px 121px #fff, 804px 1671px #fff, 1314px 270px #fff, 440px 1341px #fff, 1216px 511px #fff, 1061px 1523px #fff, 97px 274px #fff, 704px 1318px #fff, 52px 1872px #fff, 1962px 296px #fff, 111px 289px #fff, 1157px 1236px #fff, 1347px 1451px #fff, 820px 286px #fff, 1389px 1169px #fff, 644px 841px #fff, 1286px 522px #fff, 955px 659px #fff, 428px 1805px #fff, 237px 557px #fff, 1689px 1058px #fff, 636px 1882px #fff, 1349px 1664px #fff, 1548px 432px #fff, 1841px 504px #fff, 302px 252px #fff, 827px 1765px #fff, 620px 123px #fff, 207px 748px #fff, 1454px 1234px #fff, 1967px 1790px #fff, 542px 33px #fff, 742px 1214px #fff, 255px 1402px #fff, 74px 1772px #fff, 699px 475px #fff, 980px 1253px #fff, 534px 1676px #fff, 909px 202px #fff, 1498px 1251px #fff, 1796px 120px #fff, 1409px 1263px #fff, 1627px 995px #fff, 969px 710px #fff, 1674px 676px #fff, 1832px 759px #fff, 1623px 563px #fff, 251px 1790px #fff, 96px 1688px #fff, 886px 239px #fff, 778px 150px #fff, 1767px 430px #fff, 765px 1259px #fff, 1189px 877px #fff, 444px 1629px #fff, 1560px 324px #fff, 1952px 1097px #fff, 712px 1173px #fff, 541px 911px #fff, 827px 1420px #fff, 1233px 285px #fff, 784px 546px #fff, 645px 285px #fff, 1273px 1255px #fff, 1821px 174px #fff, 221px 1795px #fff, 1004px 456px #fff, 1298px 941px #fff, 274px 387px #fff, 174px 376px #fff, 1491px 258px #fff, 1489px 1946px #fff, 1134px 1382px #fff, 1289px 1145px #fff, 464px 358px #fff, 1249px 1842px #fff, 1665px 831px #fff, 1982px 84px #fff, 541px 774px #fff, 1994px 523px #fff, 762px 1644px #fff, 1730px 867px #fff, 1951px 1287px #fff, 911px 1691px #fff, 1454px 725px #fff, 1287px 1940px #fff, 70px 564px #fff, 1980px 638px #fff, 1674px 1774px #fff, 1720px 116px #fff, 1747px 182px #fff, 1040px 450px #fff, 1795px 375px #fff, 857px 1471px #fff, 1326px 1730px #fff, 915px 274px #fff, 1224px 358px #fff, 1808px 60px #fff, 43px 1870px #fff, 1810px 1536px #fff, 1564px 1719px #fff, 731px 1388px #fff, 1953px 1967px #fff, 1744px 1119px #fff, 794px 1384px #fff, 959px 714px #fff, 18px 1932px #fff, 1358px 1437px #fff, 355px 939px #fff, 1355px 1648px #fff, 608px 719px #fff, 383px 758px #fff, 1164px 1681px #fff, 1045px 253px #fff, 424px 1279px #fff, 1899px 359px #fff, 379px 488px #fff, 214px 465px #fff, 179px 905px #fff, 830px 1993px #fff, 448px 1077px #fff, 1880px 1354px #fff, 1973px 347px #fff, 745px 1025px #fff, 788px 1007px #fff, 1377px 883px #fff, 6px 290px #fff, 1312px 407px #fff, 1398px 622px #fff, 1405px 339px #fff, 1198px 1709px #fff, 988px 1226px #fff, 87px 1459px #fff, 1113px 1698px #fff, 997px 732px #fff, 708px 331px #fff, 1876px 1112px #fff, 1729px 1797px #fff, 719px 703px #fff, 1295px 522px #fff, 758px 1061px #fff, 1309px 1014px #fff, 1327px 1365px #fff, 854px 1317px #fff, 531px 1001px #fff, 1751px 1040px #fff, 1354px 190px #fff, 800px 1538px #fff, 88px 1455px #fff, 668px 39px #fff, 1379px 41px #fff, 892px 524px #fff, 54px 649px #fff, 1289px 730px #fff, 727px 488px #fff, 181px 842px #fff, 1230px 64px #fff, 3px 857px #fff, 292px 1201px #fff, 1343px 673px #fff, 1096px 1412px #fff, 1520px 292px #fff, 104px 1683px #fff, 934px 1387px #fff, 314px 739px #fff;
          animation: animStar 100s linear infinite;
        }
        #stars2:after {
          content: " ";
          position: absolute;
          top: 2000px;
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow:
            1925px 1320px #fff, 693px 1778px #fff, 1016px 711px #fff, 1171px 563px #fff, 661px 1919px #fff, 1610px 44px #fff, 1275px 140px #fff, 1208px 1802px #fff, 1473px 1587px #fff, 11px 1117px #fff, 853px 1757px #fff, 1149px 937px #fff, 1353px 428px #fff, 270px 279px #fff, 258px 1404px #fff, 417px 1188px #fff, 286px 561px #fff, 393px 1765px #fff, 147px 881px #fff, 666px 1097px #fff, 1425px 1278px #fff, 806px 156px #fff, 1252px 561px #fff, 218px 52px #fff, 1371px 1980px #fff, 171px 745px #fff, 1424px 89px #fff, 137px 244px #fff, 939px 1922px #fff, 137px 1080px #fff, 1757px 50px #fff, 904px 536px #fff, 1938px 1001px #fff, 1172px 440px #fff, 72px 1475px #fff, 102px 121px #fff, 804px 1671px #fff, 1314px 270px #fff, 440px 1341px #fff, 1216px 511px #fff, 1061px 1523px #fff, 97px 274px #fff, 704px 1318px #fff, 52px 1872px #fff, 1962px 296px #fff, 111px 289px #fff, 1157px 1236px #fff, 1347px 1451px #fff, 820px 286px #fff, 1389px 1169px #fff, 644px 841px #fff, 1286px 522px #fff, 955px 659px #fff, 428px 1805px #fff, 237px 557px #fff, 1689px 1058px #fff, 636px 1882px #fff, 1349px 1664px #fff, 1548px 432px #fff, 1841px 504px #fff, 302px 252px #fff, 827px 1765px #fff, 620px 123px #fff, 207px 748px #fff, 1454px 1234px #fff, 1967px 1790px #fff, 542px 33px #fff, 742px 1214px #fff, 255px 1402px #fff, 74px 1772px #fff, 699px 475px #fff, 980px 1253px #fff, 534px 1676px #fff, 909px 202px #fff, 1498px 1251px #fff, 1796px 120px #fff, 1409px 1263px #fff, 1627px 995px #fff, 969px 710px #fff, 1674px 676px #fff, 1832px 759px #fff, 1623px 563px #fff, 251px 1790px #fff, 96px 1688px #fff, 886px 239px #fff, 778px 150px #fff, 1767px 430px #fff, 765px 1259px #fff, 1189px 877px #fff, 444px 1629px #fff, 1560px 324px #fff, 1952px 1097px #fff, 712px 1173px #fff, 541px 911px #fff, 827px 1420px #fff, 1233px 285px #fff, 784px 546px #fff, 645px 285px #fff, 1273px 1255px #fff, 1821px 174px #fff, 221px 1795px #fff, 1004px 456px #fff, 1298px 941px #fff, 274px 387px #fff, 174px 376px #fff, 1491px 258px #fff, 1489px 1946px #fff, 1134px 1382px #fff, 1289px 1145px #fff, 464px 358px #fff, 1249px 1842px #fff, 1665px 831px #fff, 1982px 84px #fff, 541px 774px #fff, 1994px 523px #fff, 762px 1644px #fff, 1730px 867px #fff, 1951px 1287px #fff, 911px 1691px #fff, 1454px 725px #fff, 1287px 1940px #fff, 70px 564px #fff, 1980px 638px #fff, 1674px 1774px #fff, 1720px 116px #fff, 1747px 182px #fff, 1040px 450px #fff, 1795px 375px #fff, 857px 1471px #fff, 1326px 1730px #fff, 915px 274px #fff, 1224px 358px #fff, 1808px 60px #fff, 43px 1870px #fff, 1810px 1536px #fff, 1564px 1719px #fff, 731px 1388px #fff, 1953px 1967px #fff, 1744px 1119px #fff, 794px 1384px #fff, 959px 714px #fff, 18px 1932px #fff, 1358px 1437px #fff, 355px 939px #fff, 1355px 1648px #fff, 608px 719px #fff, 383px 758px #fff, 1164px 1681px #fff, 1045px 253px #fff, 424px 1279px #fff, 1899px 359px #fff, 379px 488px #fff, 214px 465px #fff, 179px 905px #fff, 830px 1993px #fff, 448px 1077px #fff, 1880px 1354px #fff, 1973px 347px #fff, 745px 1025px #fff, 788px 1007px #fff, 1377px 883px #fff, 6px 290px #fff, 1312px 407px #fff, 1398px 622px #fff, 1405px 339px #fff, 1198px 1709px #fff, 988px 1226px #fff, 87px 1459px #fff, 1113px 1698px #fff, 997px 732px #fff, 708px 331px #fff, 1876px 1112px #fff, 1729px 1797px #fff, 719px 703px #fff, 1295px 522px #fff, 758px 1061px #fff, 1309px 1014px #fff, 1327px 1365px #fff, 854px 1317px #fff, 531px 1001px #fff, 1751px 1040px #fff, 1354px 190px #fff, 800px 1538px #fff, 88px 1455px #fff, 668px 39px #fff, 1379px 41px #fff, 892px 524px #fff, 54px 649px #fff, 1289px 730px #fff, 727px 488px #fff, 181px 842px #fff, 1230px 64px #fff, 3px 857px #fff, 292px 1201px #fff, 1343px 673px #fff, 1096px 1412px #fff, 1520px 292px #fff, 104px 1683px #fff, 934px 1387px #fff, 314px 739px #fff;
        }
        #stars3 {
          width: 3px;
          height: 3px;
          background: transparent;
          box-shadow:
            200px 981px #fff, 1731px 521px #fff, 132px 1039px #fff, 1888px 1547px #fff, 899px 1226px #fff, 1887px 580px #fff, 1548px 1092px #fff, 1626px 689px #fff, 254px 1072px #fff, 1684px 1211px #fff, 672px 1267px #fff, 939px 668px #fff, 1969px 645px #fff, 1126px 983px #fff, 457px 568px #fff, 476px 876px #fff, 829px 1896px #fff, 1364px 1846px #fff, 1507px 1120px #fff, 936px 1948px #fff, 1833px 832px #fff, 1424px 285px #fff, 1377px 1596px #fff, 432px 153px #fff, 1348px 1410px #fff, 1529px 954px #fff, 1102px 387px #fff, 264px 297px #fff, 811px 977px #fff, 1931px 673px #fff, 1734px 978px #fff, 1772px 1567px #fff, 1197px 1400px #fff, 764px 282px #fff, 1103px 822px #fff, 872px 1803px #fff, 1057px 1763px #fff, 52px 1299px #fff, 1312px 1236px #fff, 235px 1082px #fff, 299px 1086px #fff, 1017px 1602px #fff, 1950px 626px #fff, 1306px 132px #fff, 1358px 1618px #fff, 1873px 1718px #fff, 1447px 940px #fff, 1888px 1195px #fff, 1704px 1765px #fff, 872px 1357px #fff, 1555px 1120px #fff, 250px 1415px #fff, 450px 415px #fff, 492px 901px #fff, 170px 1641px #fff, 56px 1129px #fff, 627px 1514px #fff, 1221px 500px #fff, 324px 1895px #fff, 1397px 1775px #fff, 1966px 598px #fff, 1550px 763px #fff, 326px 1605px #fff, 261px 969px #fff, 890px 281px #fff, 736px 544px #fff, 589px 1262px #fff, 1581px 368px #fff, 1900px 1132px #fff, 1914px 585px #fff, 1864px 1517px #fff, 241px 217px #fff, 859px 787px #fff, 996px 1729px #fff, 741px 121px #fff, 418px 414px #fff, 142px 967px #fff, 387px 896px #fff, 703px 562px #fff, 968px 1136px #fff, 1682px 332px #fff, 1287px 846px #fff, 256px 1427px #fff, 1885px 432px #fff, 1739px 1458px #fff, 345px 1769px #fff, 1140px 1612px #fff, 192px 1921px #fff, 920px 471px #fff, 834px 881px #fff, 917px 1803px #fff, 466px 1266px #fff, 483px 1108px #fff, 689px 986px #fff, 1279px 786px #fff, 458px 910px #fff, 1250px 870px #fff, 785px 1654px #fff, 1543px 1757px #fff, 287px 1272px #fff;
          animation: animStar 150s linear infinite;
        }
        #stars3:after {
          content: " ";
          position: absolute;
          top: 2000px;
          width: 3px;
          height: 3px;
          background: transparent;
          box-shadow:
            200px 981px #fff, 1731px 521px #fff, 132px 1039px #fff, 1888px 1547px #fff, 899px 1226px #fff, 1887px 580px #fff, 1548px 1092px #fff, 1626px 689px #fff, 254px 1072px #fff, 1684px 1211px #fff, 672px 1267px #fff, 939px 668px #fff, 1969px 645px #fff, 1126px 983px #fff, 457px 568px #fff, 476px 876px #fff, 829px 1896px #fff, 1364px 1846px #fff, 1507px 1120px #fff, 936px 1948px #fff, 1833px 832px #fff, 1424px 285px #fff, 1377px 1596px #fff, 432px 153px #fff, 1348px 1410px #fff, 1529px 954px #fff, 1102px 387px #fff, 264px 297px #fff, 811px 977px #fff, 1931px 673px #fff, 1734px 978px #fff, 1772px 1567px #fff, 1197px 1400px #fff, 764px 282px #fff, 1103px 822px #fff, 872px 1803px #fff, 1057px 1763px #fff, 52px 1299px #fff, 1312px 1236px #fff, 235px 1082px #fff, 299px 1086px #fff, 1017px 1602px #fff, 1950px 626px #fff, 1306px 132px #fff, 1358px 1618px #fff, 1873px 1718px #fff, 1447px 940px #fff, 1888px 1195px #fff, 1704px 1765px #fff, 872px 1357px #fff, 1555px 1120px #fff, 250px 1415px #fff, 450px 415px #fff, 492px 901px #fff, 170px 1641px #fff, 56px 1129px #fff, 627px 1514px #fff, 1221px 500px #fff, 324px 1895px #fff, 1397px 1775px #fff, 1966px 598px #fff, 1550px 763px #fff, 326px 1605px #fff, 261px 969px #fff, 890px 281px #fff, 736px 544px #fff, 589px 1262px #fff, 1581px 368px #fff, 1900px 1132px #fff, 1914px 585px #fff, 1864px 1517px #fff, 241px 217px #fff, 859px 787px #fff, 996px 1729px #fff, 741px 121px #fff, 418px 414px #fff, 142px 967px #fff, 387px 896px #fff, 703px 562px #fff, 968px 1136px #fff, 1682px 332px #fff, 1287px 846px #fff, 256px 1427px #fff, 1885px 432px #fff, 1739px 1458px #fff, 345px 1769px #fff, 1140px 1612px #fff, 192px 1921px #fff, 920px 471px #fff, 834px 881px #fff, 917px 1803px #fff, 466px 1266px #fff, 483px 1108px #fff, 689px 986px #fff, 1279px 786px #fff, 458px 910px #fff, 1250px 870px #fff, 785px 1654px #fff, 1543px 1757px #fff, 287px 1272px #fff;
        }
        @keyframes animStar {
          from {
            transform: translateY(0px);
          }
          to {
            transform: translateY(-2000px);
          }
        }
        .premium-card {
          --white: hsl(0, 0%, 100%);
          --black: hsl(240, 15%, 9%);
          --paragraph: hsl(0, 0%, 83%);
          --line: hsl(240, 9%, 17%);
          --primary: hsl(189, 92%, 58%);

          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background-color: hsla(240, 15%, 9%, 1);
          background-image: radial-gradient(
              at 88% 40%,
              hsla(240, 15%, 9%, 1) 0px,
              transparent 85%
            ),
            radial-gradient(at 49% 30%, hsla(240, 15%, 9%, 1) 0px, transparent 85%),
            radial-gradient(at 14% 26%, hsla(240, 15%, 9%, 1) 0px, transparent 85%),
            radial-gradient(at 0% 64%, hsl(189, 99%, 26%) 0px, transparent 85%),
            radial-gradient(at 41% 94%, hsl(189, 97%, 36%) 0px, transparent 85%),
            radial-gradient(at 100% 99%, hsl(188, 94%, 13%) 0px, transparent 85%);
          border-radius: 1rem;
          box-shadow: 0px -16px 24px 0px rgba(255, 255, 255, 0.25) inset;
        }
        .premium-card__border {
          overflow: hidden;
          pointer-events: none;
          position: absolute;
          z-index: -10;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: calc(100% + 2px);
          height: calc(100% + 2px);
          background-image: linear-gradient(
            0deg,
            hsl(0, 0%, 100%) -50%,
            hsl(0, 0%, 40%) 100%
          );
          border-radius: 1rem;
        }
        .premium-card__border::before {
          content: "";
          pointer-events: none;
          position: fixed;
          z-index: 200;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%), rotate(0deg);
          transform-origin: left;
          width: 200%;
          height: 10rem;
          background-image: linear-gradient(
            0deg,
            hsla(0, 0%, 100%, 0) 0%,
            hsl(189, 100%, 50%) 40%,
            hsl(189, 100%, 50%) 60%,
            hsla(0, 0%, 40%, 0) 100%
          );
          animation: rotate 8s linear infinite;
        }
        @keyframes rotate {
          to {
            transform: rotate(360deg);
          }
        }
        .premium-card > * {
          position: relative;
          z-index: 1;
        }
        .premium-card-button {
          cursor: pointer;
          padding: 0.5rem;
          width: 100%;
          background-image: linear-gradient(
            0deg,
            hsl(189, 92%, 58%),
            hsl(189, 99%, 26%) 100%
          );
          font-size: 0.75rem;
          color: var(--white);
          border: 0;
          border-radius: 9999px;
          box-shadow: inset 0 -2px 25px -4px var(--white);
        }
      `}</style>
      <div className="premium-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn min-h-[calc(100vh-10rem)] flex flex-col justify-between relative">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div className="relative z-10">
      <div>
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" />
            Nâng cấp trải nghiệm
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            TOP TRUYỆN AUDIO <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Premium</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Chức năng thanh toán đang được chuẩn bị và chưa phát sinh giao dịch thật. Tham gia đăng ký nhận thông báo ngay hôm nay.
          </p>
        </div>

        {/* Current Subscription Status */}
        {userSubscription && userSubscription.isActive && (
          <div className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gói Premium hiện tại</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Ngày còn lại</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{userSubscription.daysRemaining} ngày</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Tiến độ</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{userSubscription.percentageRemaining}%</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Gói</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{userSubscription.plan?.name || 'Premium'}</p>
              </div>
            </div>
            {userSubscription.endAt && (
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Ngày hết hạn: <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(userSubscription.endAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-renew"
                  checked={autoRenew}
                  onChange={handleToggleAutoRenew}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
                <label htmlFor="auto-renew" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  Tự động gia hạn khi hết hạn
                </label>
              </div>
              {userSubscription.shouldNotify && (
                <div className="px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold">
                  Sắp hết hạn
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-4 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className={`premium-card relative rounded-3xl p-6 sm:p-8 flex flex-col shadow-lg ${plan.isPopular ? 'scale-105' : ''}`}
            >
              <div className="premium-card__border"></div>
              {(plan.isPopular || plan.isBestDeal) && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full shadow-lg ${plan.isPopular ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950' : 'bg-cyan-500 text-slate-950'}`}>
                  {plan.isPopular ? 'Được đề xuất' : (plan.isBestDeal ? 'Tiết kiệm nhất' : '')}
                </div>
              )}

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h2>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(plan.priceVnd)}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/ {plan.durationDays} ngày</span>
                </div>
                {plan.originalPriceVnd && plan.savingsVnd && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-slate-400 dark:text-slate-500 line-through">{formatCurrency(plan.originalPriceVnd)}</span>
                    <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md">
                      Tiết kiệm {formatCurrency(plan.savingsVnd)}
                    </span>
                  </div>
                )}
                {plan.code === 'PREMIUM_SEMIANNUAL' && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">Chỉ 45.000đ/tháng</p>
                )}
                {plan.code === 'PREMIUM_ANNUAL' && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">Chỉ 40.000đ/tháng</p>
                )}
                {plan.code === 'PREMIUM_QUARTERLY' && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">Chỉ 50.000đ/tháng</p>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`premium-card-button py-3.5 rounded-xl text-sm font-bold transition-all mb-8 shadow-md ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:opacity-90'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Chọn gói {plan.durationDays / 30} tháng
              </button>

              <ul className="space-y-4 flex-1">
                {PRIVILEGES.map((privilege, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{privilege}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tiếp nhận yêu cầu hỗ trợ 24/7</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bạn có thể gửi yêu cầu bất cứ lúc nào. Thời gian phản hồi phụ thuộc mức độ ưu tiên và khả năng hỗ trợ thực tế. 
              (Tính năng đang được mô phỏng).
            </p>
          </div>
          <button 
            onClick={() => setShowSupportForm(true)}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap min-h-[44px]"
          >
            Gửi yêu cầu
          </button>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Câu Hỏi Thường Gặp</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[4px_4px_0_0] shadow-slate-300 dark:shadow-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                  className="w-full flex cursor-pointer items-center justify-between gap-4 px-4 py-3 font-medium text-slate-900 dark:text-slate-100 hover:bg-yellow-50 dark:hover:bg-slate-800 focus:bg-yellow-50 dark:focus:bg-slate-800 focus:outline-none"
                >
                  <span className="font-semibold">{faq.question}</span>
                  <ChevronDown className={`size-5 shrink-0 text-slate-600 dark:text-slate-400 transition-transform ${openFaqId === faq.id ? 'rotate-180' : ''}`} />
                </button>
                {openFaqId === faq.id && (
                  <div className="p-4 bg-white dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700">
                    <p className="text-slate-700 dark:text-slate-300">{faq.answer}</p>
                    <button
                      onClick={() => {
                        setSelectedQuestion(faq.question);
                        setShowSupportForm(true);
                      }}
                      className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Cần hỗ trợ thêm?
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedPlan && (
        <Portal>
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 overflow-hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUpAndFade z-10 my-auto">
              
              <div className="p-6 sm:p-8">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                  {isSuccess ? <Check className="w-6 h-6 text-green-500 dark:text-green-400" /> : <AlertCircle className="w-6 h-6 text-amber-500 dark:text-amber-400" />}
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {paymentLoading ? 'Đang tạo thanh toán...' : 
                   paymentStatus === 'PAID' ? 'Thanh toán thành công!' :
                   paymentStatus === 'PENDING' ? 'Thanh toán đang chờ xử lý' :
                   'Thanh toán Premium'}
                </h2>
                
                {paymentLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Đang tạo yêu cầu thanh toán...</p>
                  </div>
                ) : paymentStatus === 'PAID' ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                      <Check className="w-8 h-8 text-green-500 dark:text-green-400" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center">
                      Chúc mừng! Bạn đã kích hoạt thành công gói <strong className="text-slate-900 dark:text-white">{selectedPlan.name}</strong>.
                      Tài khoản của bạn giờ đã có quyền Premium.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                    >
                      Tiếp tục trải nghiệm
                    </button>
                  </>
                ) : paymentResponse ? (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Mã đơn hàng:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{paymentResponse.orderCode}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Gói:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{paymentResponse.planName}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Số tiền:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(paymentResponse.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Trạng thái:</span>
                        <span className={`text-sm font-bold ${
                          paymentStatus === 'PENDING' ? 'text-amber-600 dark:text-amber-400' :
                          paymentStatus === 'PAID' ? 'text-green-600 dark:text-green-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {paymentStatus === 'PENDING' ? 'Chờ thanh toán' :
                           paymentStatus === 'PAID' ? 'Đã thanh toán' :
                           'Thất bại'}
                        </span>
                      </div>
                    </div>

                    {paymentResponse.qrCode && (
                      <div className="mb-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">Quét mã QR để thanh toán:</p>
                        <div className="flex justify-center">
                          <PaymentQrCode value={paymentResponse.qrCode} size={192} />
                        </div>
                      </div>
                    )}

                    {paymentResponse.checkoutUrl && (
                      <a 
                        href={paymentResponse.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors min-h-[44px] text-center mb-3"
                      >
                        Thanh toán qua cổng PayOS
                      </a>
                    )}

                    <div className="space-y-3">
                      <button
                        onClick={handleRetryStatusCheck}
                        disabled={checkingStatus}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {checkingStatus ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang kiểm tra...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Kiểm tra trạng thái
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                      >
                        Đóng
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                      Bạn đã chọn gói <strong className="text-slate-900 dark:text-white">{selectedPlan.name}</strong> với giá <strong className="text-slate-900 dark:text-white">{formatCurrency(selectedPlan.priceVnd)}</strong>.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={handleCreatePayment}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                      >
                        Tiến hành thanh toán
                      </button>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                      >
                        Hủy
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Support Form Modal */}
      {showSupportForm && (
        <Portal>
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 overflow-hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowSupportForm(false)} />
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUpAndFade z-10 my-auto">
              <div className="p-6 sm:p-8">
                <button 
                  onClick={() => setShowSupportForm(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
                  <LifeBuoy className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Gửi Yêu Cầu Hỗ Trợ</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Chúng tôi sẽ phản hồi trong thời gian sớm nhất có thể.
                </p>

                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Câu hỏi</label>
                    <input
                      type="text"
                      value={selectedQuestion}
                      readOnly
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email liên hệ</label>
                    <input
                      type="email"
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nội dung hỗ trợ</label>
                    <textarea
                      required
                      rows={4}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSupportForm(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl min-h-[40px] cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 min-h-[40px] cursor-pointer"
                    >
                      Gửi Yêu Cầu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}
      <div className="mt-12 pb-12 border-t border-slate-200 dark:border-slate-800 pt-8">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-xl mx-auto px-4">
          * Cam kết "Không quảng cáo" áp dụng cho các quảng cáo từ hệ thống TOP TRUYỆN AUDIO. 
          Các quảng cáo nằm trong nội dung gốc (ví dụ: MC đọc quảng cáo trong file audio) hoặc quảng cáo từ nền tảng thứ ba 
          phát sinh do giới hạn kỹ thuật (ví dụ: YouTube) không nằm trong phạm vi cam kết này.
        </p>
      </div>
      </div>
    </>
  );
};
