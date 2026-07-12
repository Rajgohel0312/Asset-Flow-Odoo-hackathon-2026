export const toUserDTO = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || null,
    profileImage: user.profileImage || null,
    status: user.status,
    role: user.role ? { id: user.role.id, name: user.role.name } : null,
    createdAt: user.createdAt,
  };
};

export const toUserListDTO = (users) => {
  if (!users) return [];
  return users.map(toUserDTO);
};
