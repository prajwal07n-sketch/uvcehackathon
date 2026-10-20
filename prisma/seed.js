import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Campus-Share database with authentic student credentials...');

  // Clean existing records
  await prisma.rentalTransaction.deleteMany({});
  await prisma.cadResource.deleteMany({});
  await prisma.hardwareItem.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = bcrypt.hashSync('campus123', 10);

  // 1. Seed Users with verified accounts and hashed passwords
  const aarav = await prisma.user.create({
    data: {
      id: 'usr_aarav',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@campus.edu',
      passwordHash: defaultPasswordHash,
      usn: '1UV22EC012',
      department: 'Electronics & Communication',
      semester: 6,
      phone: '+91 98765 43210',
      isVerified: true,
      trustScore: 115,
      role: 'STUDENT',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const priya = await prisma.user.create({
    data: {
      id: 'usr_priya',
      name: 'Priya Nair',
      email: 'priya.nair@campus.ac.in',
      passwordHash: defaultPasswordHash,
      usn: '1UV21ME045',
      department: 'Mechanical Engineering',
      semester: 8,
      phone: '+91 98765 12345',
      isVerified: true,
      trustScore: 140,
      role: 'STUDENT',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
  });

  const rohan = await prisma.user.create({
    data: {
      id: 'usr_rohan',
      name: 'Rohan Kulkarni',
      email: 'rohan.k@campus.edu',
      passwordHash: defaultPasswordHash,
      usn: '1UV22CS089',
      department: 'Computer Science & Eng',
      semester: 6,
      phone: '+91 98450 99887',
      isVerified: true,
      trustScore: 95,
      role: 'STUDENT',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
  });

  const labAdmin = await prisma.user.create({
    data: {
      id: 'usr_labadmin',
      name: 'Dr. M. S. Venkatesh (Lab Coordinator)',
      email: 'labadmin.ece@campus.ac.in',
      passwordHash: defaultPasswordHash,
      usn: 'FAC-ECE-04',
      department: 'Center for Robotics & IoT',
      semester: 0,
      phone: '+91 94480 11223',
      isVerified: true,
      trustScore: 250,
      role: 'LAB_ADMIN',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Seed Hardware Items
  const hw1 = await prisma.hardwareItem.create({
    data: {
      id: 'hw_stm32',
      title: 'STM32 Nucleo-F446RE Cortex-M4 Board',
      category: 'Embedded Boards',
      description: 'High-performance ARM Cortex-M4 microcontroller running at 180MHz with 512KB Flash, 128KB SRAM. Arduino Uno V3 connectivity and ST morpho headers.',
      specs: JSON.stringify({
        core: 'ARM Cortex-M4 with FPU',
        clockSpeed: '180 MHz',
        flash: '512 KB',
        sram: '128 KB',
        voltage: '3.3V / 5V USB',
        interfaces: ['SPI', 'I2C', 'UART', 'CAN', 'USB OTG'],
      }),
      condition: 'NEW',
      maintenanceFee: 0,
      securityDeposit: 0,
      campusLocation: 'Innovation Lab, 3rd Floor',
      imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&auto=format&fit=crop&q=80',
      status: 'AVAILABLE',
      ownerId: aarav.id,
    },
  });

  const hw2 = await prisma.hardwareItem.create({
    data: {
      id: 'hw_bno055',
      title: 'Bosch BNO055 9-DOF Intelligent Absolute Orientation IMU',
      category: 'Sensors',
      description: 'System in Package integrating a triaxial 14-bit accelerometer, a 16-bit gyroscope, a geomagnetic sensor, and an ARM Cortex-M0 processor running BSX3.0 FusionLib.',
      specs: JSON.stringify({
        dimensions: '9-DOF Absolute Orientation',
        output: 'Euler Angles, Quaternions, Rotation Vector',
        interface: 'I2C / UART (3.3V logic)',
        current: '12.3 mA',
      }),
      condition: 'GOOD',
      maintenanceFee: 0,
      securityDeposit: 50,
      campusLocation: 'Instrumentation Dept, Room 204',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      status: 'AVAILABLE',
      ownerId: priya.id,
    },
  });

  const hw3 = await prisma.hardwareItem.create({
    data: {
      id: 'hw_radar',
      title: 'TI IWR6843 60GHz-64GHz mmWave Radar Evaluation Module',
      category: 'Sensors',
      description: 'Industrial mmWave sensor for sub-millimeter motion tracking, vital signs monitoring, and autonomous mobile robot mapping.',
      specs: JSON.stringify({
        frequency: '60 to 64 GHz',
        antennas: '4 RX, 3 TX virtual array (12 channels)',
        dsp: 'TI C674x DSP + ARM Cortex-R4F MCU',
        detectionRange: 'Up to 50 meters',
      }),
      condition: 'GOOD',
      maintenanceFee: 30,
      securityDeposit: 200,
      campusLocation: 'Central Library Maker Hub',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
      status: 'AVAILABLE',
      ownerId: labAdmin.id,
    },
  });

  const hw4 = await prisma.hardwareItem.create({
    data: {
      id: 'hw_hakko',
      title: 'Hakko FX-888D Digital Soldering Station',
      category: 'Lab Tools',
      description: 'Reliable digital soldering station with temperature adjustment (50°C-480°C), digital calibration, password protection, and rapid thermal recovery.',
      specs: JSON.stringify({
        powerConsumption: '70W',
        temperatureRange: '50 to 480°C (120 to 899°F)',
        temperatureStability: '±1°C at idle',
        tipType: 'T18 Series compatible',
      }),
      condition: 'GOOD',
      maintenanceFee: 15,
      securityDeposit: 100,
      campusLocation: 'ECE Workshop, Ground Floor',
      imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
      status: 'BOOKED',
      ownerId: labAdmin.id,
    },
  });

  const hw5 = await prisma.hardwareItem.create({
    data: {
      id: 'hw_odrive',
      title: 'ODrive v3.6 High Performance Dual BLDC Motor Driver',
      category: 'Robotics Parts',
      description: 'Dual brushless motor controller supporting field oriented control (FOC), incremental/absolute encoders, trajectory planning, and CAN bus control.',
      specs: JSON.stringify({
        voltage: '24V - 56V input',
        peakCurrent: '120A total (60A continuous per channel)',
        interfaces: ['CAN 2.0B', 'UART', 'PWM', 'Step/Dir', 'USB'],
        controlModes: 'Position, Velocity, Current/Torque loop',
      }),
      condition: 'NEW',
      maintenanceFee: 25,
      securityDeposit: 150,
      campusLocation: 'Innovation Lab, Mechatronics Bay',
      imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop&q=80',
      status: 'AVAILABLE',
      ownerId: priya.id,
    },
  });

  const hw6 = await prisma.hardwareItem.create({
    data: {
      id: 'hw_oscilloscope',
      title: 'Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope',
      category: 'Lab Tools',
      description: 'UltraVision technology offering 50MHz bandwidth, 4 analog channels, 1GSa/s real-time sample rate, and deep 24Mpts memory depth for waveform analysis.',
      specs: JSON.stringify({
        channels: '4 Analog Channels',
        bandwidth: '50 MHz (expandable)',
        sampleRate: '1 GSa/s real-time',
        memoryDepth: '24 Mpts standard',
      }),
      condition: 'GOOD',
      maintenanceFee: 20,
      securityDeposit: 150,
      campusLocation: 'Center for Robotics & IoT, Lab 102',
      imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=600&auto=format&fit=crop&q=80',
      status: 'AVAILABLE',
      ownerId: labAdmin.id,
    },
  });

  // 3. Seed CAD Resources
  await prisma.cadResource.create({
    data: {
      id: 'cad_cycloidal',
      title: 'High-Reduction Robotic Cycloidal Drive (11:1 Ratio)',
      description: 'Zero-backlash, high-torque cycloidal reducer engineered for quadruped robot actuators and robotic arm joints. Features eccentric cam, needle pin rollers, and output flange.',
      fileUrl: '/cad-models/cycloidal-gearbox.stl',
      previewMeshUrl: '/cad-models/cycloidal-gearbox.stl',
      fileFormat: 'STL',
      softwareUsed: 'SolidWorks 2024 / Fusion 360',
      materialRecommendation: 'Carbon Fiber PLA / PETG-CF',
      infillPercent: 50,
      toleranceNotes: '0.12mm clearance on roller holes; calibrate flow rate prior to printing.',
      licenseType: 'CC-BY-SA 4.0',
      downloadsCount: 142,
      fileSize: '2.4 MB',
      uploaderId: priya.id,
    },
  });

  await prisma.cadResource.create({
    data: {
      id: 'cad_axial_flux',
      title: '12-Slot Dual-Rotor Axial Flux BLDC Stator Core',
      description: 'Parametric CAD stator core and coil-winding bobbin assembly for student electric vehicle hub motors. Optimized for low cogging torque and high magnetic flux efficiency.',
      fileUrl: '/cad-models/axial-flux-stator.stl',
      previewMeshUrl: '/cad-models/axial-flux-stator.stl',
      fileFormat: 'STEP',
      softwareUsed: 'Onshape & FreeCAD',
      materialRecommendation: 'High-Temp PEEK or ABS for heat dissipation',
      infillPercent: 80,
      toleranceNotes: 'Ensure heat deflection temperature > 110°C; 0.15mm slot tolerance.',
      licenseType: 'Open Source Hardware (OSHW)',
      downloadsCount: 89,
      fileSize: '4.8 MB',
      uploaderId: priya.id,
    },
  });

  await prisma.cadResource.create({
    data: {
      id: 'cad_sensor_case',
      title: 'Snap-Fit Weatherproof ESP32-S3 IoT Node Case',
      description: 'Rugged enclosure designed with O-ring groove, cable gland cutout, SMA antenna mount, and internal standoffs for BNO055 and environmental air quality sensors.',
      fileUrl: '/cad-models/esp32-sensor-enclosure.stl',
      previewMeshUrl: '/cad-models/esp32-sensor-enclosure.stl',
      fileFormat: 'STL',
      softwareUsed: 'Autodesk Fusion 360',
      materialRecommendation: 'ASA or PETG (UV resistant for outdoor deployment)',
      infillPercent: 30,
      toleranceNotes: 'Snap tabs tuned for 0.2mm layer height; no support structures required.',
      licenseType: 'MIT License',
      downloadsCount: 231,
      fileSize: '1.1 MB',
      uploaderId: aarav.id,
    },
  });

  await prisma.cadResource.create({
    data: {
      id: 'cad_gimbal_linkage',
      title: 'Autonomous Drone 2-Axis Brushless Gimbal Arm Linkage',
      description: 'Lightweight aerospace pitch-and-roll structural linkage engineered for aerial photogrammetry cameras. Features integrated wire raceways and ball bearing pockets.',
      fileUrl: '/cad-models/drone-gimbal-linkage.stl',
      previewMeshUrl: '/cad-models/drone-gimbal-linkage.stl',
      fileFormat: 'OBJ',
      softwareUsed: 'Siemens Solid Edge / Blender',
      materialRecommendation: 'Nylon PA12 / Carbon Fiber Polycarbonate',
      infillPercent: 40,
      toleranceNotes: 'Press-fit pockets for 6802RS bearings (15x24x5mm).',
      licenseType: 'CERN OHL-S v2',
      downloadsCount: 67,
      fileSize: '3.2 MB',
      uploaderId: rohan.id,
    },
  });

  // 4. Seed Transactions
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);

  await prisma.rentalTransaction.create({
    data: {
      id: 'tx_active_01',
      hardwareId: hw4.id,
      borrowerId: aarav.id,
      startDate: today,
      endDate: nextWeek,
      status: 'CHECKED_OUT',
      meetupSpot: 'Central Library Maker Hub (Ground Floor)',
      handoverNotes: 'Soldering station verified in pristine working state. Includes sponge, brass wire cleaner, and 1.6D chisel tip.',
      conditionPhotoUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
    },
  });

  await prisma.rentalTransaction.create({
    data: {
      id: 'tx_pending_02',
      hardwareId: hw2.id,
      borrowerId: rohan.id,
      startDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      meetupSpot: 'Instrumentation Dept, Room 204',
      handoverNotes: 'Borrowing for Autonomous Rover final year project demonstration.',
    },
  });

  await prisma.rentalTransaction.create({
    data: {
      id: 'tx_returned_03',
      hardwareId: hw1.id,
      borrowerId: aarav.id,
      startDate: twoWeeksAgo,
      endDate: fiveDaysAgo,
      status: 'RETURNED',
      meetupSpot: 'Innovation Lab, 3rd Floor',
      handoverNotes: 'Returned on schedule in anti-static bag. Pins checked and tested with blink test firmware. +15 Trust Score awarded.',
    },
  });

  console.log('✅ Seed completed! Test users password is "campus123"');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
