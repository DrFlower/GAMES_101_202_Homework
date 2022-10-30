# yue.nicholas@gmail.com

SET( ILMTHREAD_LIBRARY_SOURCES
  IlmThread.cpp
  IlmThreadMutex.cpp
  IlmThreadMutexPosix.cpp
  IlmThreadPool.cpp
  IlmThreadPosix.cpp
  IlmThreadSemaphore.cpp
  IlmThreadSemaphorePosixCompat.cpp
  IlmThreadSemaphorePosix.cpp
)
IF (WIN32)
  SET( ILMTHREAD_LIBRARY_SOURCES ${ILMTHREAD_LIBRARY_SOURCES}
    IlmThreadMutexWin32.cpp
    IlmThreadSemaphoreWin32.cpp
    IlmThreadWin32.cpp
	)
ENDIF()


IF(ILMBASE_BUILD_SHARED_LIBS)
  ADD_DEFINITIONS(-DILMTHREAD_EXPORTS)
ENDIF()

ADD_LIBRARY ( IlmThread ${LIB_TYPE}
  ${ILMTHREAD_LIBRARY_SOURCES}
)
TARGET_LINK_LIBRARIES(IlmThread Iex)

INSTALL ( TARGETS
  IlmThread
  DESTINATION
  ${OPENEXR_INSTALL_LIB_DEST}
)

INSTALL ( FILES 
  IlmThreadPool.h
  IlmThread.h
  IlmThreadSemaphore.h
  IlmThreadMutex.h
  IlmThreadNamespace.h
  IlmThreadExport.h
  IlmThreadForward.h
  DESTINATION
  ${OPENEXR_INSTALL_HEADER_DEST}
)
