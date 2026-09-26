"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import app from "../../firebase";

type Club = {
  id: string;
  name: string;
  userId: string;
};

type Team = {
  id: string;
  name: string;
  birthYear: string;
  clubId: string;
};

type UploadedFile = {
  public_id: string;
  resource_type?: string;
  format?: string | null;
  bytes?: number;
  type?: string;
  secure_url?: string | null;
  name?: string;
};

type Player = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  nationalId: string;
  motherName: string;
  school: string;
  position: string;
  jerseyNumber: string;
  guardianPhone: string;

  photoUrl?: string;
  photoName?: string;
  photoType?: string;
  photoSize?: number;

  fatherId?: UploadedFile;
  motherId?: UploadedFile;
  birthCertificate?: UploadedFile;
  schoolCertificate?: UploadedFile;
  otherDocument?: UploadedFile;

  teamId: string;
  teamName: string;
  birthYear: string;

  approvalStatus: string;
  rejectionReason?: string;

  registrationNumber?: string;
  registrationDate?: string;

  playerStatus?: string;
  releaseDate?: any;

  previousTeamId?: string;
  previousTeamName?: string;
  transferDate?: any;
};

export default function ClubPlayersPage() {
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [motherName, setMotherName] = useState("");
  const [school, setSchool] = useState("");
  const [position, setPosition] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [fatherId, setFatherId] = useState<File | null>(null);
  const [motherId, setMotherId] = useState<File | null>(null);
  const [birthCertificate, setBirthCertificate] =
    useState<File | null>(null);
  const [schoolCertificate, setSchoolCertificate] =
    useState<File | null>(null);
  const [otherDocument, setOtherDocument] =
    useState<File | null>(null);

  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const [editingPlayer, setEditingPlayer] =
    useState<Player | null>(null);

  const [showPlayerDetails, setShowPlayerDetails] =
    useState(false);

  const [showReleaseConfirm, setShowReleaseConfirm] =
    useState(false);

  const [showTransfer, setShowTransfer] =
    useState(false);

  const [transferTeamId, setTransferTeamId] =
    useState("");

  async function loadData(userId: string) {
    try {
      setLoading(true);
      setMessage("");

      const clubQuery = query(
        collection(db, "clubs"),
        where("userId", "==", userId)
      );

      const clubSnapshot = await getDocs(clubQuery);

      if (clubSnapshot.empty) {
        setMessage("لم يتم العثور على النادي");
        setLoading(false);
        return;
      }

      const clubDoc = clubSnapshot.docs[0];

      const clubData: Club = {
        id: clubDoc.id,
        ...(clubDoc.data() as Omit<Club, "id">),
      };

      setClub(clubData);

      const teamsQuery = query(
        collection(db, "teams"),
        where("clubId", "==", clubData.id)
      );

      const teamsSnapshot = await getDocs(teamsQuery);

      const teamsData: Team[] = teamsSnapshot.docs
        .map((teamDoc) => ({
          id: teamDoc.id,
          ...(teamDoc.data() as Omit<Team, "id">),
        }))
        .sort((a, b) =>
          String(a.birthYear).localeCompare(
            String(b.birthYear)
          )
        );

      setTeams(teamsData);

      const playersQuery = query(
        collection(db, "players"),
        where("clubId", "==", clubData.id)
      );

      const playersSnapshot = await getDocs(playersQuery);

      const playersData: Player[] =
        playersSnapshot.docs.map((playerDoc) => ({
          id: playerDoc.id,
          ...(playerDoc.data() as Omit<Player, "id">),
        }));

      setPlayers(playersData);
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء تحميل بيانات النادي");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          window.location.href = "/club-login";
          return;
        }

        await loadData(user.uid);
      }
    );

    return () => unsubscribe();
  }, []);

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("من فضلك اختر صورة صحيحة");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setMessage("");
  }

  function handleDocumentChange(
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      setMessage("يسمح بالصور وملفات PDF فقط");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("حجم المستند يجب ألا يتجاوز 10 ميجابايت");
      return;
    }

    setter(file);
    setMessage("");
  }

  async function uploadFile(
    file: File,
    field: string,
    clubId: string
  ): Promise<UploadedFile> {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("يجب تسجيل الدخول أولًا");
    }

    const token = await user.getIdToken();

    const formData = new FormData();

    formData.append("file", file);
    formData.append("field", field);
    formData.append("clubId", clubId);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "فشل رفع الملف"
      );
    }

    return {
      public_id: data.public_id,
      resource_type: data.resource_type,
      format: data.format,
      bytes: data.bytes,
      type: data.type,
      secure_url: data.secure_url,
      name: file.name,
    };
  }

  async function addPlayer() {
    if (!club) {
      setMessage("بيانات النادي غير متاحة");
      return;
    }

    if (!selectedTeamId) {
      setMessage("اختار الفريق أولًا");
      return;
    }

    if (!fullName.trim()) {
      setMessage("اكتب اسم اللاعب");
      return;
    }

    if (!dateOfBirth) {
      setMessage("اكتب تاريخ ميلاد اللاعب");
      return;
    }

    if (!nationalId.trim()) {
      setMessage("اكتب الرقم القومي");
      return;
    }

    if (!motherName.trim()) {
      setMessage("اكتب اسم الأم");
      return;
    }

    if (!school.trim()) {
      setMessage("اكتب المدرسة");
      return;
    }

    if (!position) {
      setMessage("اختار مركز اللاعب");
      return;
    }

    if (!jerseyNumber.trim()) {
      setMessage("اكتب رقم القميص");
      return;
    }

    if (!guardianPhone.trim()) {
      setMessage("اكتب رقم ولي الأمر");
      return;
    }

    if (!photo) {
      setMessage("اختار صورة اللاعب");
      return;
    }

    if (!fatherId) {
      setMessage("ارفع صورة بطاقة الأب");
      return;
    }

    if (!motherId) {
      setMessage("ارفع صورة بطاقة الأم");
      return;
    }

    if (!birthCertificate) {
      setMessage("ارفع شهادة الميلاد");
      return;
    }

    if (!schoolCertificate) {
      setMessage("ارفع إفادة المدرسة");
      return;
    }

    const selectedTeam = teams.find(
      (team) => team.id === selectedTeamId
    );

    if (!selectedTeam) {
      setMessage("الفريق المختار غير موجود");
      return;
    }

    try {
      setSaving(true);
      setMessage("جاري إضافة اللاعب...");

      const playerRef = await addDoc(
        collection(db, "players"),
        {
          fullName: fullName.trim(),
          dateOfBirth,
          nationalId: nationalId.trim(),
          motherName: motherName.trim(),
          school: school.trim(),
          position,
          jerseyNumber: jerseyNumber.trim(),
          guardianPhone: guardianPhone.trim(),

          clubId: club.id,
          clubName: club.name,

          teamId: selectedTeam.id,
          teamName: selectedTeam.name,
          birthYear: selectedTeam.birthYear,

          approvalStatus: "pending",
          playerStatus: "active",
          rejectionReason: "",

          createdAt: serverTimestamp(),
        }
      );

      setMessage("جاري رفع صورة اللاعب...");

      const uploadedPhoto = await uploadFile(
        photo,
        "photo",
        club.id
      );

      setMessage("جاري رفع مستندات اللاعب...");

      const uploadedFatherId = await uploadFile(
        fatherId,
        "fatherId",
        club.id
      );

      const uploadedMotherId = await uploadFile(
        motherId,
        "motherId",
        club.id
      );

      const uploadedBirthCertificate =
        await uploadFile(
          birthCertificate,
          "birthCertificate",
          club.id
        );

      const uploadedSchoolCertificate =
        await uploadFile(
          schoolCertificate,
          "schoolCertificate",
          club.id
        );

      let uploadedOtherDocument:
        | UploadedFile
        | undefined;

      if (otherDocument) {
        uploadedOtherDocument =
          await uploadFile(
            otherDocument,
            "other",
            club.id
          );
      }

      await updateDoc(
        doc(db, "players", playerRef.id),
        {
          photoUrl:
            uploadedPhoto.secure_url || "",

          photoName: photo.name,
          photoType: photo.type,
          photoSize: photo.size,

          fatherId: uploadedFatherId,
          motherId: uploadedMotherId,
          birthCertificate:
            uploadedBirthCertificate,
          schoolCertificate:
            uploadedSchoolCertificate,

          ...(uploadedOtherDocument
            ? {
                otherDocument:
                  uploadedOtherDocument,
              }
            : {}),

          updatedAt: serverTimestamp(),
        }
      );

      clearForm();

      setMessage(
        "تم إضافة اللاعب ورفع جميع المستندات بنجاح، وهو الآن قيد المراجعة ✅"
      );

      if (auth.currentUser) {
        await loadData(auth.currentUser.uid);
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إضافة اللاعب"
      );
    } finally {
      setSaving(false);
    }
  }

  function clearForm() {
    setFullName("");
    setDateOfBirth("");
    setNationalId("");
    setMotherName("");
    setSchool("");
    setPosition("");
    setJerseyNumber("");
    setGuardianPhone("");
    setSelectedTeamId("");

    setPhoto(null);
    setPhotoPreview("");

    setFatherId(null);
    setMotherId(null);
    setBirthCertificate(null);
    setSchoolCertificate(null);
    setOtherDocument(null);
  }

  function openPlayerDetails(player: Player) {
    setSelectedPlayer(player);
    setShowPlayerDetails(true);
  }

  function closeAllModals() {
    setShowPlayerDetails(false);
    setShowReleaseConfirm(false);
    setShowTransfer(false);
    setTransferTeamId("");
  }

  function startEditRejectedPlayer(
    player: Player
  ) {
    setEditingPlayer(player);

    setFullName(player.fullName || "");
    setDateOfBirth(player.dateOfBirth || "");
    setNationalId(player.nationalId || "");
    setMotherName(player.motherName || "");
    setSchool(player.school || "");
    setPosition(player.position || "");
    setJerseyNumber(player.jerseyNumber || "");
    setGuardianPhone(player.guardianPhone || "");
    setSelectedTeamId(player.teamId || "");

    setPhoto(null);
    setPhotoPreview("");

    setFatherId(null);
    setMotherId(null);
    setBirthCertificate(null);
    setSchoolCertificate(null);
    setOtherDocument(null);

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingPlayer(null);
    clearForm();
    setMessage("");
  }

  async function updateRejectedPlayer() {
    if (!editingPlayer || !club) return;

    if (!selectedTeamId) {
      setMessage("اختار الفريق أولًا");
      return;
    }

    if (!fullName.trim()) {
      setMessage("اكتب اسم اللاعب");
      return;
    }

    if (!dateOfBirth) {
      setMessage("اكتب تاريخ ميلاد اللاعب");
      return;
    }

    if (!nationalId.trim()) {
      setMessage("اكتب الرقم القومي");
      return;
    }

    if (!motherName.trim()) {
      setMessage("اكتب اسم الأم");
      return;
    }

    if (!school.trim()) {
      setMessage("اكتب المدرسة");
      return;
    }

    if (!position) {
      setMessage("اختار مركز اللاعب");
      return;
    }

    if (!jerseyNumber.trim()) {
      setMessage("اكتب رقم القميص");
      return;
    }

    if (!guardianPhone.trim()) {
      setMessage("اكتب رقم ولي الأمر");
      return;
    }

    const selectedTeam = teams.find(
      (team) => team.id === selectedTeamId
    );

    if (!selectedTeam) {
      setMessage("الفريق المختار غير موجود");
      return;
    }

    try {
      setSaving(true);
      setMessage("جاري حفظ التعديل...");

      const updateData: any = {
        fullName: fullName.trim(),
        dateOfBirth,
        nationalId: nationalId.trim(),
        motherName: motherName.trim(),
        school: school.trim(),
        position,
        jerseyNumber: jerseyNumber.trim(),
        guardianPhone: guardianPhone.trim(),

        teamId: selectedTeam.id,
        teamName: selectedTeam.name,
        birthYear: selectedTeam.birthYear,

        approvalStatus: "pending",
        rejectionReason: "",

        updatedAt: serverTimestamp(),
      };

      if (photo) {
        setMessage("جاري رفع صورة اللاعب...");

        const uploadedPhoto = await uploadFile(
          photo,
          "photo",
          club.id
        );

        updateData.photoUrl =
          uploadedPhoto.secure_url || "";

        updateData.photoName = photo.name;
        updateData.photoType = photo.type;
        updateData.photoSize = photo.size;
      }

      if (fatherId) {
        setMessage("جاري رفع بطاقة الأب...");

        updateData.fatherId =
          await uploadFile(
            fatherId,
            "fatherId",
            club.id
          );
      }

      if (motherId) {
        setMessage("جاري رفع بطاقة الأم...");

        updateData.motherId =
          await uploadFile(
            motherId,
            "motherId",
            club.id
          );
      }

      if (birthCertificate) {
        setMessage("جاري رفع شهادة الميلاد...");

        updateData.birthCertificate =
          await uploadFile(
            birthCertificate,
            "birthCertificate",
            club.id
          );
      }

      if (schoolCertificate) {
        setMessage("جاري رفع إفادة المدرسة...");

        updateData.schoolCertificate =
          await uploadFile(
            schoolCertificate,
            "schoolCertificate",
            club.id
          );
      }

      if (otherDocument) {
        setMessage("جاري رفع المستند الآخر...");

        updateData.otherDocument =
          await uploadFile(
            otherDocument,
            "other",
            club.id
          );
      }

      await updateDoc(
        doc(db, "players", editingPlayer.id),
        updateData
      );

      setEditingPlayer(null);
      clearForm();

      setMessage(
        "تم تعديل بيانات اللاعب وإرساله للمراجعة مرة أخرى ✅"
      );

      if (auth.currentUser) {
        await loadData(auth.currentUser.uid);
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تعديل بيانات اللاعب"
      );
    } finally {
      setSaving(false);
    }
  }

  async function releasePlayer() {
    if (!selectedPlayer) return;

    try {
      setSaving(true);
      setMessage("");

      await updateDoc(
        doc(db, "players", selectedPlayer.id),
        {
          playerStatus: "released",
          releaseDate: serverTimestamp(),
        }
      );

      setMessage(
        `تم الاستغناء عن اللاعب ${selectedPlayer.fullName} بنجاح`
      );

      closeAllModals();

      if (auth.currentUser) {
        await loadData(auth.currentUser.uid);
      }
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء الاستغناء عن اللاعب");
    } finally {
      setSaving(false);
    }
  }

  async function transferPlayer() {
    if (!selectedPlayer) return;

    if (!transferTeamId) {
      setMessage("اختار الفريق الجديد أولًا");
      return;
    }

    if (transferTeamId === selectedPlayer.teamId) {
      setMessage("اللاعب موجود بالفعل في هذا الفريق");
      return;
    }

    const newTeam = teams.find(
      (team) => team.id === transferTeamId
    );

    if (!newTeam) {
      setMessage("الفريق الجديد غير موجود");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await updateDoc(
        doc(db, "players", selectedPlayer.id),
        {
          teamId: newTeam.id,
          teamName: newTeam.name,
          birthYear: newTeam.birthYear,

          playerStatus: "active",

          previousTeamId: selectedPlayer.teamId,
          previousTeamName: selectedPlayer.teamName,

          transferDate: serverTimestamp(),
        }
      );

      setMessage(
        `تم نقل ${selectedPlayer.fullName} إلى ${newTeam.name} بنجاح 🔄`
      );

      closeAllModals();

      if (auth.currentUser) {
        await loadData(auth.currentUser.uid);
      }
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء نقل اللاعب");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
      >
        <p className="text-slate-400">
          جاري تحميل بيانات النادي...
        </p>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-5 py-8 text-white lg:px-10"
    >
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <p className="text-sm text-slate-400">
            لوحة النادي
          </p>

          <h1 className="mt-2 text-4xl font-extrabold">
            👤 إضافة وإدارة اللاعبين
          </h1>

          <p className="mt-3 text-slate-400">
            {club?.name || "النادي"}
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center">
            {message}
          </div>
        )}

        {editingPlayer && (
          <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">
            <p className="text-sm text-yellow-300">
              تعديل لاعب مرفوض
            </p>

            <h2 className="mt-1 text-xl font-bold">
              {editingPlayer.fullName}
            </h2>

            {editingPlayer.rejectionReason && (
              <p className="mt-3 leading-7 text-slate-300">
                سبب الرفض:{" "}
                <span className="font-bold text-red-300">
                  {editingPlayer.rejectionReason}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">

            <h2 className="mb-6 text-xl font-bold">
              {editingPlayer
                ? "✏️ تعديل بيانات اللاعب المرفوض"
                : "بيانات اللاعب"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="اسم اللاعب بالكامل"
                value={fullName}
                onChange={setFullName}
                placeholder="اكتب اسم اللاعب"
              />

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  الفريق
                </label>

                <select
                  value={selectedTeamId}
                  onChange={(e) =>
                    setSelectedTeamId(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                >
                  <option value="">
                    اختر الفريق
                  </option>

                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  تاريخ الميلاد
                </label>

                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) =>
                    setDateOfBirth(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                />
              </div>

              <Field
                label="الرقم القومي"
                value={nationalId}
                onChange={setNationalId}
                placeholder="الرقم القومي"
              />

              <Field
                label="اسم الأم"
                value={motherName}
                onChange={setMotherName}
                placeholder="اسم الأم"
              />

              <Field
                label="المدرسة"
                value={school}
                onChange={setSchool}
                placeholder="اسم المدرسة"
              />

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  المركز
                </label>

                <select
                  value={position}
                  onChange={(e) =>
                    setPosition(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                >
                  <option value="">
                    اختر المركز
                  </option>

                  <option value="حارس مرمى">
                    حارس مرمى
                  </option>

                  <option value="مدافع">
                    مدافع
                  </option>

                  <option value="ظهير أيمن">
                    ظهير أيمن
                  </option>

                  <option value="ظهير أيسر">
                    ظهير أيسر
                  </option>

                  <option value="وسط">
                    وسط
                  </option>

                  <option value="جناح أيمن">
                    جناح أيمن
                  </option>

                  <option value="جناح أيسر">
                    جناح أيسر
                  </option>

                  <option value="مهاجم">
                    مهاجم
                  </option>
                </select>
              </div>

              <Field
                label="رقم القميص"
                value={jerseyNumber}
                onChange={setJerseyNumber}
                placeholder="رقم القميص"
              />

              <Field
                label="رقم ولي الأمر"
                value={guardianPhone}
                onChange={setGuardianPhone}
                placeholder="رقم الهاتف"
              />

            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <h2 className="mb-6 text-xl font-bold">
              📷 صورة اللاعب
            </h2>

            <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-slate-950 p-5 text-center">

              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="صورة اللاعب"
                  className="h-52 w-full rounded-xl object-cover"
                />
              ) : (
                <>
                  <div className="text-5xl">
                    📷
                  </div>

                  <p className="mt-4 font-bold">
                    {editingPlayer
                      ? "اضغط لاختيار صورة جديدة"
                      : "اضغط لاختيار صورة اللاعب"}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    PNG أو JPG — بحد أقصى 5MB
                  </p>

                  {editingPlayer && (
                    <p className="mt-2 text-xs text-yellow-300">
                      ترك الصورة بدون تغيير مسموح أثناء التعديل
                    </p>
                  )}
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

            </label>

            {photo && (
              <p className="mt-3 truncate text-center text-sm text-slate-400">
                {photo.name}
              </p>
            )}

          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              📁 مستندات اللاعب
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              المستندات مطلوبة للمراجعة، ولا تظهر للزوار.
              الصور وملفات PDF مسموحة بحد أقصى 10MB لكل مستند.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <DocumentUpload
              label="🪪 صورة بطاقة الأب"
              file={fatherId}
              onChange={(e) =>
                handleDocumentChange(
                  e,
                  setFatherId
                )
              }
            />

            <DocumentUpload
              label="🪪 صورة بطاقة الأم"
              file={motherId}
              onChange={(e) =>
                handleDocumentChange(
                  e,
                  setMotherId
                )
              }
            />

            <DocumentUpload
              label="📄 شهادة الميلاد"
              file={birthCertificate}
              onChange={(e) =>
                handleDocumentChange(
                  e,
                  setBirthCertificate
                )
              }
            />

            <DocumentUpload
              label="🏫 إفادة المدرسة"
              file={schoolCertificate}
              onChange={(e) =>
                handleDocumentChange(
                  e,
                  setSchoolCertificate
                )
              }
            />

            <DocumentUpload
              label="📎 مستند آخر — اختياري"
              file={otherDocument}
              onChange={(e) =>
                handleDocumentChange(
                  e,
                  setOtherDocument
                )
              }
            />

          </div>
        </div>

        <div className="mt-6">

          <button
            onClick={
              editingPlayer
                ? updateRejectedPlayer
                : addPlayer
            }
            disabled={
              saving || teams.length === 0
            }
            className="w-full rounded-2xl bg-green-500 px-6 py-4 text-lg font-extrabold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "جاري الحفظ والرفع..."
              : editingPlayer
              ? "✓ حفظ التعديل وإعادة المراجعة"
              : "✓ إضافة اللاعب للمراجعة"}
          </button>

          {editingPlayer && (
            <button
              onClick={cancelEdit}
              className="mt-3 w-full rounded-xl bg-white/10 py-3 font-bold transition hover:bg-white/20"
            >
              إلغاء التعديل
            </button>
          )}

        </div>

        <div className="mt-10">

          <h2 className="mb-5 text-2xl font-bold">
            لاعبو النادي
          </h2>

          {players.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
              لا يوجد لاعبون حتى الآن
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {players.map((player) => (

                <div
                  key={player.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <h3 className="text-lg font-bold">
                        {player.fullName}
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        {player.teamName}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        مواليد {player.birthYear}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white/10 px-3 py-2">
                      👤
                    </div>

                  </div>

                  <div className="mt-4">

                    {player.playerStatus === "released" ? (
                      <span className="rounded-full bg-slate-500/10 px-3 py-1 text-sm text-slate-300">
                        ● مستغنى عنه
                      </span>
                    ) : player.approvalStatus === "approved" ? (
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                        ● معتمد
                      </span>
                    ) : player.approvalStatus === "pending" ? (
                      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-400">
                        ● قيد المراجعة
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">
                        ● مرفوض
                      </span>
                    )}

                  </div>

                  {player.approvalStatus === "rejected" &&
                    player.rejectionReason && (
                      <div className="mt-4 rounded-xl bg-red-500/10 p-4">
                        <p className="text-sm text-red-300">
                          سبب الرفض
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {player.rejectionReason}
                        </p>
                      </div>
                    )}

                  {player.approvalStatus === "approved" && (
                    <div className="mt-4 rounded-xl bg-blue-500/10 p-4">

                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-slate-400">
                          رقم التسجيل
                        </span>

                        <span className="font-bold text-blue-400">
                          {player.registrationNumber || "-"}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between gap-3">
                        <span className="text-sm text-slate-400">
                          تاريخ التسجيل
                        </span>

                        <span className="font-bold">
                          {player.registrationDate || "-"}
                        </span>
                      </div>

                    </div>
                  )}

                  <button
                    onClick={() =>
                      openPlayerDetails(player)
                    }
                    className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-3 font-bold transition hover:bg-white/10"
                  >
                    👁️ الاطلاع على بيانات اللاعب
                  </button>

                  {player.approvalStatus === "rejected" && (
                    <button
                      onClick={() =>
                        startEditRejectedPlayer(player)
                      }
                      className="mt-3 w-full rounded-xl bg-yellow-500/10 py-3 font-bold text-yellow-300 transition hover:bg-yellow-500/20"
                    >
                      ✏️ تعديل البيانات وإعادة المراجعة
                    </button>
                  )}

                </div>

              ))}

            </div>
          )}

        </div>

      </div>

      {showPlayerDetails && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6">

            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-sm text-slate-400">
                  بيانات اللاعب
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {selectedPlayer.fullName}
                </h2>
              </div>

              <button
                onClick={closeAllModals}
                className="rounded-xl bg-white/10 px-4 py-2"
              >
                ✕
              </button>

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <Info
                label="اسم اللاعب"
                value={selectedPlayer.fullName}
              />

              <Info
                label="الفريق"
                value={selectedPlayer.teamName}
              />

              <Info
                label="مواليد"
                value={selectedPlayer.birthYear}
              />

              <Info
                label="تاريخ الميلاد"
                value={selectedPlayer.dateOfBirth}
              />

              <Info
                label="الرقم القومي"
                value={selectedPlayer.nationalId}
              />

              <Info
                label="اسم الأم"
                value={selectedPlayer.motherName}
              />

              <Info
                label="المدرسة"
                value={selectedPlayer.school}
              />

              <Info
                label="المركز"
                value={selectedPlayer.position}
              />

              <Info
                label="رقم القميص"
                value={selectedPlayer.jerseyNumber}
              />

              <Info
                label="رقم ولي الأمر"
                value={selectedPlayer.guardianPhone}
              />

              <Info
                label="رقم التسجيل"
                value={
                  selectedPlayer.registrationNumber || "-"
                }
              />

              <Info
                label="تاريخ التسجيل"
                value={
                  selectedPlayer.registrationDate || "-"
                }
              />

            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">

              <h3 className="mb-4 text-lg font-bold">
                📁 حالة المستندات
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">

                <DocumentStatus
                  label="بطاقة الأب"
                  uploaded={!!selectedPlayer.fatherId}
                />

                <DocumentStatus
                  label="بطاقة الأم"
                  uploaded={!!selectedPlayer.motherId}
                />

                <DocumentStatus
                  label="شهادة الميلاد"
                  uploaded={
                    !!selectedPlayer.birthCertificate
                  }
                />

                <DocumentStatus
                  label="إفادة المدرسة"
                  uploaded={
                    !!selectedPlayer.schoolCertificate
                  }
                />

                <DocumentStatus
                  label="مستند آخر"
                  uploaded={
                    !!selectedPlayer.otherDocument
                  }
                />

              </div>

              <p className="mt-4 text-xs leading-6 text-slate-500">
                المستندات الحساسة محفوظة بشكل خاص، وسيتم
                فتحها لاحقًا من خلال صلاحيات النادي والأدمن فقط.
              </p>

            </div>

            {selectedPlayer.approvalStatus === "rejected" &&
              selectedPlayer.rejectionReason && (
                <div className="mt-6 rounded-xl bg-red-500/10 p-4">
                  <p className="text-sm text-red-300">
                    سبب الرفض
                  </p>

                  <p className="mt-2 leading-7 text-slate-300">
                    {selectedPlayer.rejectionReason}
                  </p>
                </div>
              )}

            <div className="mt-6 border-t border-white/10 pt-6">

              <h3 className="mb-4 font-bold">
                إجراءات اللاعب
              </h3>

              {selectedPlayer.approvalStatus === "rejected" && (
                <button
                  onClick={() => {
                    closeAllModals();
                    startEditRejectedPlayer(selectedPlayer);
                  }}
                  className="mb-3 w-full rounded-xl bg-yellow-500/10 px-5 py-3 font-bold text-yellow-300 transition hover:bg-yellow-500/20"
                >
                  ✏️ تعديل البيانات وإعادة المراجعة
                </button>
              )}

              {selectedPlayer.approvalStatus === "approved" &&
                selectedPlayer.playerStatus !== "released" && (
                  <div className="grid gap-3 sm:grid-cols-2">

                    <button
                      onClick={() =>
                        setShowReleaseConfirm(true)
                      }
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/20"
                    >
                      🚫 الاستغناء عن اللاعب
                    </button>

                    <button
                      onClick={() => {
                        setTransferTeamId("");
                        setShowTransfer(true);
                      }}
                      className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 font-bold text-blue-300 transition hover:bg-blue-500/20"
                    >
                      🔄 نقل اللاعب لفريق آخر
                    </button>

                  </div>
                )}

              {selectedPlayer.playerStatus === "released" && (
                <div className="rounded-xl bg-slate-500/10 p-4 text-center text-slate-300">
                  هذا اللاعب تم الاستغناء عنه بالفعل.
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {showReleaseConfirm && selectedPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">

            <h2 className="text-xl font-bold">
              🚫 الاستغناء عن اللاعب
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              هل أنت متأكد من الاستغناء عن اللاعب:
            </p>

            <p className="mt-2 font-bold text-white">
              {selectedPlayer.fullName}
            </p>

            <p className="mt-3 text-sm text-slate-400">
              سيتم الاحتفاظ ببيانات اللاعب ورقم تسجيله،
              ولن يتم حذف سجله من النظام.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <button
                onClick={releasePlayer}
                disabled={saving}
                className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "جاري التنفيذ..."
                  : "نعم، استغناء"}
              </button>

              <button
                onClick={() =>
                  setShowReleaseConfirm(false)
                }
                className="rounded-xl bg-white/10 px-5 py-3 font-bold"
              >
                إلغاء
              </button>

            </div>

          </div>

        </div>
      )}

      {showTransfer && selectedPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">

            <h2 className="text-xl font-bold">
              🔄 نقل اللاعب لفريق آخر
            </h2>

            <p className="mt-4 text-slate-300">
              اللاعب:
            </p>

            <p className="mt-1 font-bold">
              {selectedPlayer.fullName}
            </p>

            <p className="mt-4 text-sm text-slate-400">
              الفريق الحالي:
            </p>

            <p className="mt-1 font-bold text-white">
              {selectedPlayer.teamName}
            </p>

            <div className="mt-5">

              <label className="mb-2 block text-sm text-slate-300">
                الفريق الجديد
              </label>

              <select
                value={transferTeamId}
                onChange={(e) =>
                  setTransferTeamId(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                <option value="">
                  اختر الفريق الجديد
                </option>

                {teams
                  .filter(
                    (team) =>
                      team.id !== selectedPlayer.teamId
                  )
                  .map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {team.name}
                    </option>
                  ))}
              </select>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <button
                onClick={transferPlayer}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "جاري النقل..."
                  : "تأكيد النقل"}
              </button>

              <button
                onClick={() =>
                  setShowTransfer(false)
                }
                className="rounded-xl bg-white/10 px-5 py-3 font-bold"
              >
                إلغاء
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
      />
    </div>
  );
}

function DocumentUpload({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <label className="block cursor-pointer rounded-2xl border border-dashed border-white/10 bg-slate-950 p-5 transition hover:border-white/20">

      <div className="flex items-center justify-between gap-3">

        <div>
          <p className="font-bold">
            {label}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            صورة أو PDF — حتى 10MB
          </p>
        </div>

        <div className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">
          {file ? "✓ تم الاختيار" : "رفع"}
        </div>

      </div>

      {file && (
        <p className="mt-3 truncate text-sm text-green-400">
          {file.name}
        </p>
      )}

      <input
        type="file"
        accept="image/*,.pdf,application/pdf"
        onChange={onChange}
        className="hidden"
      />

    </label>
  );
}

function DocumentStatus({
  label,
  uploaded,
}: {
  label: string;
  uploaded: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4">

      <span className="text-sm text-slate-300">
        {label}
      </span>

      <span
        className={
          uploaded
            ? "text-sm font-bold text-green-400"
            : "text-sm font-bold text-red-400"
        }
      >
        {uploaded ? "✓ مرفوع" : "✕ غير مرفوع"}
      </span>

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-bold text-white">
        {value || "-"}
      </p>
    </div>
  );
}
