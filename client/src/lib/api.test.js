import { handleApiError } from "./api";

test("the shared API client broadcasts unauthorized responses and preserves the rejection", async () => {
  const error = { response: { status: 401 } };
  const dispatch = jest.spyOn(window, "dispatchEvent");

  await expect(handleApiError(error)).rejects.toBe(error);

  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "smartsafar:unauthorized" }));
  dispatch.mockRestore();
});

test("the shared API client does not log out users for non-authentication failures", async () => {
  const dispatch = jest.spyOn(window, "dispatchEvent");

  await expect(handleApiError({ response: { status: 503 } })).rejects.toMatchObject({ response: { status: 503 } });

  expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: "smartsafar:unauthorized" }));
  dispatch.mockRestore();
});
